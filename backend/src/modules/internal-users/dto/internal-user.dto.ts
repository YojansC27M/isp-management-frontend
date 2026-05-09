import { Type } from "class-transformer"
import { ArrayMinSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength, ValidateNested } from "class-validator"

const internalUserRoles = ["admin", "staff", "technician", "support"] as const
const internalUserStatuses = ["active", "inactive"] as const
const hhmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const phoneRegex = /^[0-9+\-\s()]{7,20}$/
const documentTypeRegex = /^[A-Z0-9_]{2,20}$/
const documentNumberRegex = /^[A-Za-z0-9.\-]{4,32}$/
const listSortBy = ["createdAt", "name", "email", "role"] as const
const sortDirections = ["asc", "desc"] as const

export class TechnicianAvailabilitySlotDto {
  @IsString()
  @MinLength(2)
  id!: string

  @IsString()
  @MinLength(2)
  label!: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number

  @IsString()
  @Matches(hhmmRegex)
  startTime!: string

  @IsString()
  @Matches(hhmmRegex)
  endTime!: string
}

export class TechnicianProfileDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  coverageZones!: string[]

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TechnicianAvailabilitySlotDto)
  availability!: TechnicianAvailabilitySlotDto[]

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  skills!: string[]
}

export class CreateInternalUserDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @Matches(documentTypeRegex)
  documentType!: string

  @IsString()
  @Matches(documentNumberRegex, { message: "documentNumber must be 4-32 chars and contain only letters, numbers, dot or hyphen" })
  documentNumber!: string

  @IsString()
  @MinLength(5)
  @Matches(phoneRegex, { message: "phone must contain only valid phone characters and be 7-20 chars long" })
  phone!: string

  @IsIn(internalUserRoles)
  role!: (typeof internalUserRoles)[number]

  @IsIn(internalUserStatuses)
  status!: (typeof internalUserStatuses)[number]

  @IsOptional()
  @ValidateNested()
  @Type(() => TechnicianProfileDto)
  technicianProfile?: TechnicianProfileDto | null
}

export class UpdateInternalUserDto extends CreateInternalUserDto {}

export class ListInternalUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(internalUserRoles)
  role?: (typeof internalUserRoles)[number]

  @IsOptional()
  @IsIn(internalUserStatuses)
  status?: (typeof internalUserStatuses)[number]

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number

  @IsOptional()
  @IsIn(listSortBy)
  sortBy?: (typeof listSortBy)[number]

  @IsOptional()
  @IsIn(sortDirections)
  sortDir?: (typeof sortDirections)[number]

  @IsOptional()
  @IsString()
  cursor?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}
