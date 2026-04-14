import { create } from "zustand"
import type { Permission, User } from "@/auth/types"
import { NAVIGATION_ALLOWED_ITEMS_BY_MODULE, NAVIGATION_ALLOWED_MODULE_IDS } from "@/auth/navigationCatalog"
import type { ServerNavigationModule } from "@/auth/navigationTypes"
import { clearAuthToken, getAuthToken, setAuthToken } from "@/auth/session"
import { normalizePermissions, normalizeUser } from "@/auth/validators"

const USER_KEY = "auth_user"
const PERMISSIONS_KEY = "auth_permissions"
const NAVIGATION_KEY = "auth_navigation"
const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined"

const readStoredUser = (): User | null => {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return normalizeUser(JSON.parse(raw))
  } catch {
    return null
  }
}

const readStoredPermissions = (): Permission[] => {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY)
    if (!raw) return []
    return normalizePermissions(JSON.parse(raw))
  } catch {
    return []
  }
}

const normalizeNavigationModules = (value: unknown): ServerNavigationModule[] | null => {
  if (!Array.isArray(value)) return null
  const result: ServerNavigationModule[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const id = String((item as { id?: unknown }).id ?? "").trim()
    if (!id || seen.has(id) || !NAVIGATION_ALLOWED_MODULE_IDS.has(id)) continue
    seen.add(id)

    const rawItems = (item as { items?: unknown }).items
    const allowedItemIds = NAVIGATION_ALLOWED_ITEMS_BY_MODULE.get(id)
    const items =
      Array.isArray(rawItems)
        ? Array.from(
            new Set(
              rawItems
                .map((entry) => String(entry ?? "").trim())
                .filter((entry) => Boolean(entry) && Boolean(allowedItemIds?.has(entry)))
            )
          )
        : undefined

    result.push(items ? { id, items } : { id })
  }

  return result.length > 0 ? result : []
}

const readStoredNavigation = (): ServerNavigationModule[] | null => {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(NAVIGATION_KEY)
    if (!raw) return null
    return normalizeNavigationModules(JSON.parse(raw))
  } catch {
    return null
  }
}

export interface AuthState {
  token: string | null
  user: User | null
  permissions: Permission[]
  navigation: ServerNavigationModule[] | null
  setToken: (token: string) => void
  setUser: (user: User | null) => void
  setPermissions: (permissions: Permission[]) => void
  setNavigation: (navigation: ServerNavigationModule[] | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getAuthToken(),
  user: readStoredUser(),
  permissions: readStoredPermissions(),
  navigation: readStoredNavigation(),
  setToken: (token) => {
    setAuthToken(token)
    set({ token: getAuthToken() })
  },
  setUser: (user) => {
    if (!isBrowser()) {
      set({ user: normalizeUser(user) })
      return
    }
    const normalizedUser = normalizeUser(user)

    if (normalizedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
    } else {
      localStorage.removeItem(USER_KEY)
    }
    set({ user: normalizedUser })
  },
  setPermissions: (permissions) => {
    const normalized = normalizePermissions(permissions)
    if (isBrowser()) localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(normalized))
    set({ permissions: normalized })
  },
  setNavigation: (navigation) => {
    const normalized = navigation ? normalizeNavigationModules(navigation) : null
    if (isBrowser()) {
      if (!normalized) {
        localStorage.removeItem(NAVIGATION_KEY)
      } else {
        localStorage.setItem(NAVIGATION_KEY, JSON.stringify(normalized))
      }
    }
    set({ navigation: normalized })
  },
  logout: () => {
    clearAuthToken()
    if (isBrowser()) {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(PERMISSIONS_KEY)
      localStorage.removeItem(NAVIGATION_KEY)
    }
    set({ token: null, user: null, permissions: [], navigation: null })
  },
}))
