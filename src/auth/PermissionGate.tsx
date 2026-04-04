import type { ReactNode } from "react"
import { useAuthStore } from "@/store/authStore"
import type { Permission } from "@/auth/types"
import { getUserPermissions, hasAllPermissions, hasAnyPermission } from "@/auth/permissions"

interface PermissionGateProps {
  children: ReactNode
  requiredPermissions: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

const PermissionGate = ({ children, requiredPermissions, requireAll = false, fallback = null }: PermissionGateProps) => {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)

  const allowed = requireAll
    ? hasAllPermissions(effectivePermissions, requiredPermissions)
    : hasAnyPermission(effectivePermissions, requiredPermissions)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default PermissionGate
