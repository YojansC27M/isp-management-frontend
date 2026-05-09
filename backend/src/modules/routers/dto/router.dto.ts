import { Type } from "class-transformer"
import {
  IsIn,
  IsInt,
  IsIP,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  MaxLength,
} from "class-validator"

export class CreateRouterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string

  @IsIP()
  ip!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  username!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  zone!: string

  @IsString()
  @MinLength(1)
  @MaxLength(140)
  location!: string

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number | null
}

export class UpdateRouterDto extends CreateRouterDto {}

export class TestRouterConnectionDto {
  @IsIP()
  ip!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  username!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string
}

const routerStatuses = ["online", "offline"] as const
const listSortBy = ["createdAt", "lastCheckedAt", "name", "ip", "zone", "status"] as const
const sortDirections = ["asc", "desc"] as const

export class ListRoutersQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(routerStatuses)
  status?: (typeof routerStatuses)[number]

  @IsOptional()
  @IsString()
  zone?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  perPage?: number

  @IsOptional()
  @IsIn(listSortBy)
  sortBy?: (typeof listSortBy)[number]

  @IsOptional()
  @IsIn(sortDirections)
  sortDir?: (typeof sortDirections)[number]
}
