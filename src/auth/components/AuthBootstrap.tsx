import { useEffect } from "react"
import { getAuthToken } from "@/auth/session"
import { refreshMe } from "@/auth/services/authApi"
import { useAuthStore } from "@/store/authStore"

const AuthBootstrap = () => {
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const setUser = useAuthStore((state) => state.setUser)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const setNavigation = useAuthStore((state) => state.setNavigation)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let cancelled = false

    const syncSession = async () => {
      if (!token) {
        setNavigation(null)
        return
      }

      if (user && permissions.length > 0) {
        return
      }

      try {
        const payload = await refreshMe()
        if (cancelled) return
        setUser(payload.user)
        setPermissions(payload.user.permissions)
        setNavigation(payload.navigation.modules)
      } catch {
        if (cancelled) return
        logout()
      }
    }

    syncSession()

    return () => {
      cancelled = true
    }
  }, [logout, permissions.length, setNavigation, setPermissions, setUser, token, user])

  return null
}

export default AuthBootstrap
