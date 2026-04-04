import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"

interface ProtectedRouteProps {
  children: ReactElement
  redirectTo?: string
}

const ProtectedRoute = ({ children, redirectTo = "/" }: ProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token) ?? localStorage.getItem("auth_token")

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ message: "Debes iniciar sesión para continuar." }} />
  }

  return children
}

export default ProtectedRoute
