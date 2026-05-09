import { ArrayMaxSize, ArrayUnique, IsArray, IsString, Matches } from "class-validator"

const permissionKeyRegex = /^[a-z0-9._-]+$/

export class UpdateRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  @Matches(permissionKeyRegex, { each: true })
  permissions!: string[]
}

export class UpdateUserPermissionOverridesDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  @Matches(permissionKeyRegex, { each: true })
  grants!: string[]

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  @Matches(permissionKeyRegex, { each: true })
  revokes!: string[]
}
