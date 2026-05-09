import { Type } from "class-transformer"
import { IsNumber, IsString, Max, Min, MinLength } from "class-validator"

export class InvoiceAutomationSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(28)
  cutDay!: number

  @IsString()
  @MinLength(1)
  prefix!: string

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  nextCorrelative!: number
}

