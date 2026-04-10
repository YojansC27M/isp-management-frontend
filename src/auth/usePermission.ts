import { useMemo } from "react"
import type { Permission } from "@/auth/types"
import { getUserPermissions, hasAllPermissions, hasAnyPermission, hasPermission } from "@/auth/permissions"
import { useAuthStore } from "@/store/authStore"

const useEffectivePermissions = () => {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  return useMemo(() => (permissions.length > 0 ? permissions : getUserPermissions(user)), [permissions, user])
}

export const useCan = (permission: Permission) => {
  const permissions = useEffectivePermissions()
  return hasPermission(permissions, permission)
}

export const useCanAny = (requiredPermissions: Permission[]) => {
  const permissions = useEffectivePermissions()
  return hasAnyPermission(permissions, requiredPermissions)
}

export const useCanAll = (requiredPermissions: Permission[]) => {
  const permissions = useEffectivePermissions()
  return hasAllPermissions(permissions, requiredPermissions)
}

