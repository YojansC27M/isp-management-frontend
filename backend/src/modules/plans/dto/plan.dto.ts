import { Type } from "class-transformer"
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator"

const planTypes = ["residential", "business"] as const
const listSortBy = ["createdAt", "name", "price", "downloadSpeed", "uploadSpeed"] as const
const sortDirections = ["asc", "desc"] as const

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100000)
  downloadSpeed!: number

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100000)
  uploadSpeed!: number

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(10000000)
  price!: number

  @IsIn(planTypes)
  type!: (typeof planTypes)[number]
}

export class UpdatePlanDto extends CreatePlanDto {}

export class ListPlansQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string

  @IsOptional()
  @IsIn(planTypes)
  type?: (typeof planTypes)[number]

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
