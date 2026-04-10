import { create } from "zustand"
import type { Permission, User } from "@/auth/types"
import { clearAuthToken, getAuthToken, setAuthToken } from "@/auth/session"
import { normalizePermissions, normalizeUser } from "@/auth/validators"

const USER_KEY = "auth_user"
const PERMISSIONS_KEY = "auth_permissions"
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

export interface AuthState {
  token: string | null
  user: User | null
  permissions: Permission[]
  setToken: (token: string) => void
  setUser: (user: User | null) => void
  setPermissions: (permissions: Permission[]) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getAuthToken(),
  user: readStoredUser(),
  permissions: readStoredPermissions(),
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
  logout: () => {
    clearAuthToken()
    if (isBrowser()) {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(PERMISSIONS_KEY)
    }
    set({ token: null, user: null, permissions: [] })
  },
}))
