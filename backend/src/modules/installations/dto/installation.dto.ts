import { IsDateString, IsIn, IsOptional, IsString, MinLength } from "class-validator"

const installationStatuses = ["pending", "scheduled", "installed", "suspended", "canceled"] as const
const installationOperationTypes = ["installation", "relocation", "replacement", "removal"] as const

export class CreateInstallationDto {
  @IsString()
  clientId!: string

  @IsOptional()
  @IsString()
  visitId?: string

  @IsOptional()
  @IsString()
  routerId?: string

  @IsOptional()
  @IsIn(installationOperationTypes)
  operationType?: (typeof installationOperationTypes)[number]

  @IsOptional()
  @IsIn(installationStatuses)
  status?: (typeof installationStatuses)[number]

  @IsOptional()
  @IsDateString()
  installedAt?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string
}

export class UpdateInstallationDto extends CreateInstallationDto {}

const listSortBy = ["createdAt", "updatedAt", "installedAt", "status"] as const
const sortDirections = ["asc", "desc"] as const

export class ListInstallationsQueryDto {
  @IsOptional()
  @IsString()
  clientId?: string

  @IsOptional()
  @IsString()
  routerId?: string

  @IsOptional()
  @IsString()
  visitId?: string

  @IsOptional()
  @IsIn(installationStatuses)
  status?: (typeof installationStatuses)[number]

  @IsOptional()
  @IsIn(listSortBy)
  sortBy?: (typeof listSortBy)[number]

  @IsOptional()
  @IsIn(sortDirections)
  sortDir?: (typeof sortDirections)[number]
}
