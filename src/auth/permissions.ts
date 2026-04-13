import type { Permission, Role, User } from "./types"
import { permissionCatalog } from "@/auth/permissionCatalog"

const ROLE_PERMISSIONS_KEY = "auth_role_permissions"
const ROLE_STATUS_KEY = "auth_role_status"

export const allPermissions: Permission[] = permissionCatalog.map((item) => item.permission)

export const appRoles: Role[] = ["admin", "staff", "support", "billing", "technician", "client"]

export const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  staff: "Staff",
  support: "Soporte",
  billing: "Facturacion",
  technician: "Tecnico",
  client: "Cliente",
}

export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "internal_users.read",
    "internal_users.write",
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
    "roles.read",
    "roles.write",
    "audit.read",
    "client_portal.read",
    "client_portal.write",
  ],
  staff: [
    "internal_users.read",
    "internal_users.write",
    "clients.read",
    "clients.write",
    "plans.read",
    "payments.read",
    "invoices.read",
    "tickets.read",
    "visits.read",
    "reports.read",
    "clients_map.read",
    "roles.read",
    "audit.read",
  ],
  support: ["internal_users.read", "clients.read", "tickets.read", "tickets.write", "visits.read", "visits.write"],
  billing: ["clients.read", "payments.read", "payments.write", "invoices.read", "invoices.write", "reports.read"],
  technician: ["clients.read", "tickets.read", "visits.read", "visits.write"],
  client: ["client_portal.read", "client_portal.write"],
}

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined"

const normalizePermissions = (permissions: Permission[]) => {
  const unique = new Set(permissions)
  return allPermissions.filter((permission) => unique.has(permission))
}

const defaultRoleStatus: Record<Role, boolean> = {
  admin: true,
  staff: true,
  support: true,
  billing: true,
  technician: true,
  client: true,
}

const readRolePermissionOverrides = (): Partial<Record<Role, Permission[]>> => {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Record<Role, Permission[]>>
    const next: Partial<Record<Role, Permission[]>> = {}
    for (const role of appRoles) {
      const rolePermissionsFromStorage = parsed[role]
      if (!Array.isArray(rolePermissionsFromStorage)) continue
      next[role] = normalizePermissions(rolePermissionsFromStorage)
    }
    return next
  } catch {
    return {}
  }
}

const writeRolePermissionOverrides = (overrides: Partial<Record<Role, Permission[]>>) => {
  if (!isBrowser()) return
  localStorage.setItem(ROLE_PERMISSIONS_KEY, JSON.stringify(overrides))
}

const readRoleStatusOverrides = (): Partial<Record<Role, boolean>> => {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(ROLE_STATUS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Record<Role, boolean>>
    const next: Partial<Record<Role, boolean>> = {}
    for (const role of appRoles) {
      const value = parsed[role]
      if (typeof value !== "boolean") continue
      next[role] = value
    }
    return next
  } catch {
    return {}
  }
}

const writeRoleStatusOverrides = (overrides: Partial<Record<Role, boolean>>) => {
  if (!isBrowser()) return
  localStorage.setItem(ROLE_STATUS_KEY, JSON.stringify(overrides))
}

export const getRolePermissionsMap = (): Record<Role, Permission[]> => {
  const overrides = readRolePermissionOverrides()
  const map = {} as Record<Role, Permission[]>
  for (const role of appRoles) {
    map[role] = normalizePermissions(overrides[role] ?? rolePermissions[role])
  }
  return map
}

export const getRolePermissions = (role: Role) => {
  const map = getRolePermissionsMap()
  return map[role] ?? []
}

export const getRoleStatusMap = (): Record<Role, boolean> => {
  const overrides = readRoleStatusOverrides()
  const map = {} as Record<Role, boolean>
  for (const role of appRoles) {
    map[role] = overrides[role] ?? defaultRoleStatus[role]
  }
  return map
}

export const isRoleEnabled = (role: Role) => {
  const map = getRoleStatusMap()
  return map[role] ?? true
}

export const setRoleEnabled = (role: Role, enabled: boolean) => {
  const overrides = readRoleStatusOverrides()
  if (enabled === defaultRoleStatus[role]) {
    delete overrides[role]
  } else {
    overrides[role] = enabled
  }
  writeRoleStatusOverrides(overrides)
}

export const resetRoleStatus = (role: Role) => {
  const overrides = readRoleStatusOverrides()
  delete overrides[role]
  writeRoleStatusOverrides(overrides)
}

export const setRolePermissions = (role: Role, permissions: Permission[]) => {
  const overrides = readRolePermissionOverrides()
  overrides[role] = normalizePermissions(permissions)
  writeRolePermissionOverrides(overrides)
}

export const resetRolePermissions = (role: Role) => {
  const overrides = readRolePermissionOverrides()
  delete overrides[role]
  writeRolePermissionOverrides(overrides)
}

export const resetAllRolePermissions = () => {
  if (!isBrowser()) return
  localStorage.removeItem(ROLE_PERMISSIONS_KEY)
  localStorage.removeItem(ROLE_STATUS_KEY)
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
  if (user.permissions.length > 0) return normalizePermissions(user.permissions)
  return getRolePermissions(user.role)
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
