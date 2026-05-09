import { Type } from "class-transformer"
import { IsDateString, IsIn, IsOptional, IsString } from "class-validator"

const reportExportFormats = ["csv", "json", "xlsx", "pdf"] as const

export class ReportingQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string

  @IsOptional()
  @IsString()
  zone?: string

  @IsOptional()
  @IsString()
  plan?: string
}

export class ExportReportsQueryDto extends ReportingQueryDto {
  @Type(() => String)
  @IsIn(reportExportFormats)
  format!: (typeof reportExportFormats)[number]
}
