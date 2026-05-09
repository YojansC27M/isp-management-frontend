import { Type } from "class-transformer"
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator"

const paymentStatuses = ["pending", "paid", "overdue", "refunded"] as const
const paymentMethods = ["cash", "transfer", "card", "pse", "other"] as const
const paymentListSortBy = ["paymentDate", "amount", "status", "invoiceNumber", "createdAt"] as const
const sortDirections = ["asc", "desc"] as const

export class CreatePaymentDto {
  @IsString()
  @MaxLength(64)
  clientId!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  invoiceNumber!: string

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  @Max(100000000)
  amount!: number

  @IsIn(paymentMethods)
  paymentMethod!: (typeof paymentMethods)[number]

  @IsDateString()
  paymentDate!: string

  @IsIn(paymentStatuses)
  status!: (typeof paymentStatuses)[number]
}

export class UpdatePaymentDto extends CreatePaymentDto {}

export class PaymentAccountStatusQueryDto {
  @IsOptional()
  @IsString()
  clientId?: string
}

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string

  @IsOptional()
  @IsIn(paymentStatuses)
  status?: (typeof paymentStatuses)[number]

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
  @IsIn(paymentListSortBy)
  sortBy?: (typeof paymentListSortBy)[number]

  @IsOptional()
  @IsIn(sortDirections)
  sortDir?: (typeof sortDirections)[number]
}
