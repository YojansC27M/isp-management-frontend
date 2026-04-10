import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import { isRoleEnabled } from "@/auth/permissions"
import { getAuthToken } from "@/auth/session"
import { useAuthStore } from "@/store/authStore"

interface ProtectedRouteProps {
  children: ReactElement
  redirectTo?: string
}

const ProtectedRoute = ({ children, redirectTo = "/" }: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ message: "Debes iniciar sesion para continuar." }} />
  }

  if (user && !isRoleEnabled(user.role)) {
    logout()
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          message: `El perfil ${user.role} esta inactivo. Solicita activacion para continuar.`,
          toast: {
            title: "Perfil inactivo",
            description: "Tu sesion se cerro porque el perfil fue deshabilitado.",
            type: "error",
          },
        }}
      />
    )
  }

  return children
}

export default ProtectedRoute
