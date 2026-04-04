import { create } from "zustand"
import type { Permission, User } from "@/auth/types"

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
  token: null,
  user: null,
  permissions: [],
  setToken: (token) => {
    localStorage.setItem("auth_token", token)
    set({ token })
  },
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  logout: () => {
    localStorage.removeItem("auth_token")
    set({ token: null, user: null, permissions: [] })
  },
}))
