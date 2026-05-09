import { Type } from "class-transformer"
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, Max, Min, MinLength } from "class-validator"

const clientStatuses = ["active", "suspended", "inactive"] as const
const listSortBy = ["createdAt", "name", "status"] as const
const sortDirections = ["asc", "desc"] as const

export class CreateClientDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsEmail()
  email?: string | null

  @IsOptional()
  @IsString()
  document?: string | null

  @IsOptional()
  @IsString()
  phone?: string | null

  @IsOptional()
  @IsString()
  address?: string | null

  @IsString()
  @MinLength(1)
  planId!: string

  @IsString()
  ipAddress!: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number | null

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number | null

  @IsIn(clientStatuses)
  status!: (typeof clientStatuses)[number]
}

export class UpdateClientDto extends CreateClientDto {}

export class SearchClientsQueryDto {
  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number
}

export class ListClientsQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(clientStatuses)
  status?: (typeof clientStatuses)[number]

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
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
