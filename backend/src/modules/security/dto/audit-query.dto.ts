import { Type } from "class-transformer"
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator"

export class SecurityAuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  perPage?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number

  @IsOptional()
  @IsString()
  actorId?: string

  @IsOptional()
  @IsString()
  module?: string

  @IsOptional()
  @IsString()
  action?: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}

export class SecurityAuditExportQueryDto extends SecurityAuditQueryDto {
  @IsOptional()
  @IsIn(["csv", "json", "xlsx"])
  format?: "csv" | "json" | "xlsx"
}
