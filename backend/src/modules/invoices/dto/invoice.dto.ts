import { Type } from "class-transformer"
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator"

const invoiceStatuses = ["draft", "pending", "paid", "overdue", "cancelled"] as const

export class CreateInvoiceDto {
  @IsString()
  clientId!: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  invoiceNumber?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number

  @IsDateString()
  dueDate!: string

  @IsOptional()
  @IsDateString()
  issueDate?: string

  @IsOptional()
  @IsIn(invoiceStatuses)
  status?: (typeof invoiceStatuses)[number]
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  clientId?: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  invoiceNumber?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsDateString()
  issueDate?: string

  @IsOptional()
  @IsIn(invoiceStatuses)
  status?: (typeof invoiceStatuses)[number]
}

export class CancelInvoiceDto {
  @IsString()
  @MinLength(3)
  reason!: string
}

export class GenerateInvoicesDto {
  @IsOptional()
  @IsDateString()
  referenceDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  dueDays?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultAmount?: number

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyActiveClients?: boolean
}
