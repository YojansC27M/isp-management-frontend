import type { Permission, Role, User } from "./types"

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "clients.read",
    "clients.write",
    "plans.read",
    "plans.write",
    "payments.read",
    "payments.write",
    "invoices.read",
    "invoices.write",
    "tickets.read",
    "tickets.write",
    "visits.read",
    "visits.write",
    "monitoring.read",
    "reports.read",
    "clients_map.read",
    "client_portal.read",
    "client_portal.write",
  ],
  staff: [
    "clients.read",
    "clients.write",
    "plans.read",
    "payments.read",
    "invoices.read",
    "tickets.read",
    "visits.read",
    "reports.read",
    "clients_map.read",
  ],
  support: ["clients.read", "tickets.read", "tickets.write", "visits.read", "visits.write"],
  billing: ["clients.read", "payments.read", "payments.write", "invoices.read", "invoices.write", "reports.read"],
  technician: ["clients.read", "tickets.read", "visits.read", "visits.write"],
  client: ["client_portal.read", "client_portal.write"],
}

export const hasPermission = (permissions: Permission[], permission: Permission) => {
  return permissions.includes(permission)
}

export const hasAnyPermission = (permissions: Permission[], required: Permission[]) => {
  return required.some((permission) => permissions.includes(permission))
}

export const hasAllPermissions = (permissions: Permission[], required: Permission[]) => {
  return required.every((permission) => permissions.includes(permission))
}

export const getUserPermissions = (user: User | null) => {
  if (!user) return []
  if (user.permissions.length > 0) return user.permissions
  return rolePermissions[user.role] ?? []
}

export interface NavItem {
  label: string
  href: string
  requiredPermissions?: Permission[]
  requireAll?: boolean
}

export const filterNavItems = (items: NavItem[], permissions: Permission[]) => {
  return items.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true
    return item.requireAll
      ? hasAllPermissions(permissions, item.requiredPermissions)
      : hasAnyPermission(permissions, item.requiredPermissions)
  })
}
