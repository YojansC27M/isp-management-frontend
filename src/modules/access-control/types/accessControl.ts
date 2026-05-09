export interface AccessRole {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
}

export interface AccessPermission {
  id: string
  key: string
  module: string
  label: string
  description: string | null
}

export interface RolePermissionsPayload {
  roleId: string
  permissions: string[]
  updatedAt: string
}

export interface UserPermissionOverridesPayload {
  userId: string
  roleKey: string | null
  roleName: string | null
  grants: string[]
  revokes: string[]
  updatedAt: string
}
