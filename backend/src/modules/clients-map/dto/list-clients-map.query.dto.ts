import { Type } from "class-transformer"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"
import { IsNumber, Max, Min } from "class-validator"

const clientStatuses = ["active", "suspended", "inactive"] as const

export class ListClientsMapQueryDto {
  @IsOptional()
  @IsIn(clientStatuses)
  status?: (typeof clientStatuses)[number]

  @IsOptional()
  @IsString()
  @MaxLength(120)
  zone?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  technicianName?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLat?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLng?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(200)
  radiusKm?: number

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  polygon?: string
}
