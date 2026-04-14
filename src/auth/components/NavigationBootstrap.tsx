import { useEffect } from "react"
import { getAuthToken } from "@/auth/session"
import { getNavigationConfig } from "@/auth/services/navigationApi"
import { useAuthStore } from "@/store/authStore"

const NavigationBootstrap = () => {
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  const setNavigation = useAuthStore((state) => state.setNavigation)

  useEffect(() => {
    let cancelled = false

    const loadNavigation = async () => {
      if (!token) {
        setNavigation(null)
        return
      }

      try {
        const payload = await getNavigationConfig()
        if (cancelled) return
        setNavigation(payload.modules)
      } catch {
        if (cancelled) return
        // Fallback seguro: si backend no responde, se usa navegación local por permisos.
        setNavigation(null)
      }
    }

    loadNavigation()

    return () => {
      cancelled = true
    }
  }, [setNavigation, token])

  return null
}

export default NavigationBootstrap

