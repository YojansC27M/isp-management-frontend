import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import type { Permission } from "@/auth/types"
import { getUserPermissions, hasAllPermissions, hasAnyPermission } from "@/auth/permissions"

interface PermissionRouteProps {
  children: ReactElement
  requiredPermissions: Permission[]
  requireAll?: boolean
  redirectTo?: string
  unauthorizedTo?: string
}

const PermissionRoute = ({
  children,
  requiredPermissions,
  requireAll = false,
  redirectTo = "/",
  unauthorizedTo = "/unauthorized",
}: PermissionRouteProps) => {
  const token = useAuthStore((state) => state.token) ?? localStorage.getItem("auth_token")
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)

  if (!token) {
    return <Navigate to={redirectTo} replace state={{ message: "Debes iniciar sesión para continuar." }} />
  }

  const allowed = requireAll
    ? hasAllPermissions(effectivePermissions, requiredPermissions)
    : hasAnyPermission(effectivePermissions, requiredPermissions)

  if (!allowed) {
    return <Navigate to={unauthorizedTo} replace state={{ message: "No tienes permisos para acceder." }} />
  }

  return children
}

export default PermissionRoute
