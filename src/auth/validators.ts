import { allPermissions, appRoles } from "@/auth/permissions"
import type { Permission, Role, User } from "@/auth/types"

const roleSet = new Set<Role>(appRoles)
const permissionSet = new Set<Permission>(allPermissions)

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

export const isRole = (value: unknown): value is Role => typeof value === "string" && roleSet.has(value as Role)

export const normalizePermissions = (value: unknown): Permission[] => {
  if (!Array.isArray(value)) return []
  const unique = new Set<Permission>()
  for (const item of value) {
    if (typeof item !== "string") continue
    if (!permissionSet.has(item as Permission)) continue
    unique.add(item as Permission)
  }
  return Array.from(unique)
}

export const normalizeUser = (value: unknown): User | null => {
  if (!isRecord(value)) return null
  const { id, name, email, role, permissions } = value
  if (typeof id !== "string" || !id.trim()) return null
  if (typeof name !== "string" || !name.trim()) return null
  if (typeof email !== "string" || !email.trim()) return null
  if (!isRole(role)) return null

  return {
    id: id.trim(),
    name: name.trim(),
    email: email.trim(),
    role,
    permissions: normalizePermissions(permissions),
  }
}
