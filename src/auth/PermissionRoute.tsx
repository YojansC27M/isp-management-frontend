import type { ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getFirstAllowedRoute } from "@/auth/navigation"
import { getUserPermissions, hasAllPermissions, hasAnyPermission, isRoleEnabled } from "@/auth/permissions"
import { getAuthToken } from "@/auth/session"
import type { Permission } from "@/auth/types"
import { useAuthStore } from "@/store/authStore"

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
  const location = useLocation()
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const logout = useAuthStore((state) => state.logout)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)

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

  const allowed = requireAll
    ? hasAllPermissions(effectivePermissions, requiredPermissions)
    : hasAnyPermission(effectivePermissions, requiredPermissions)

  if (!allowed) {
    const fallbackRoute = getFirstAllowedRoute(effectivePermissions)
    const targetRoute = fallbackRoute !== location.pathname ? fallbackRoute : unauthorizedTo

    return (
      <Navigate
        to={targetRoute}
        replace
        state={{
          message: "No tienes permisos para acceder.",
          deniedPath: location.pathname,
          toast: {
            title: "Acceso no autorizado",
            description: "Te llevamos a una seccion habilitada para tu perfil.",
            type: "error",
          },
        }}
      />
    )
  }

  return children
}

export default PermissionRoute
