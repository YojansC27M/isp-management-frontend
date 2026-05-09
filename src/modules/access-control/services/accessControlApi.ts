import api from "@/api/axios"
import type { AccessPermission, AccessRole, RolePermissionsPayload, UserPermissionOverridesPayload } from "../types/accessControl"

export const getAccessRoles = async () => {
  const { data } = await api.get<AccessRole[]>("/security/roles", { cancelKey: "security-roles" })
  return data
}

export const getAccessPermissions = async () => {
  const { data } = await api.get<AccessPermission[]>("/security/permissions", { cancelKey: "security-permissions" })
  return data
}

export const getRolePermissions = async (roleId: string) => {
  const { data } = await api.get<RolePermissionsPayload>(`/security/roles/${roleId}/permissions`, {
    cancelKey: `security-role-permissions:${roleId}`,
  })
  return data
}

export const updateRolePermissions = async (roleId: string, permissions: string[]) => {
  const { data } = await api.put<RolePermissionsPayload>(`/security/roles/${roleId}/permissions`, { permissions })
  return data
}

export const resetRolePermissions = async (roleId: string) => {
  const { data } = await api.post<RolePermissionsPayload>(`/security/roles/${roleId}/permissions/reset`)
  return data
}

export const resetAllRolePermissions = async () => {
  const { data } = await api.post<{ ok: boolean }>("/security/roles/permissions/reset-all")
  return data
}

export const getUserPermissionOverrides = async (userId: string) => {
  const { data } = await api.get<UserPermissionOverridesPayload>(`/security/users/${userId}/permissions`, {
    cancelKey: `security-user-permissions:${userId}`,
  })
  return data
}

export const updateUserPermissionOverrides = async (userId: string, grants: string[], revokes: string[]) => {
  const { data } = await api.put<UserPermissionOverridesPayload>(`/security/users/${userId}/permissions`, { grants, revokes })
  return data
}
