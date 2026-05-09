import { Type } from "class-transformer"
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator"

const webhookPaymentStatuses = ["paid", "refunded", "pending", "failed", "rejected", "canceled"] as const
const webhookPaymentMethods = ["cash", "transfer", "card", "pse", "other"] as const

export class PaymentWebhookDto {
  @IsString()
  @MinLength(3)
  externalTransactionId!: string

  @IsString()
  @MinLength(1)
  invoiceNumber!: string

  @IsOptional()
  @IsString()
  clientId?: string

  @IsNumber()
  @Type(() => Number)
  @Min(0.01)
  amount!: number

  @IsIn(webhookPaymentMethods)
  paymentMethod!: (typeof webhookPaymentMethods)[number]

  @IsDateString()
  paymentDate!: string

  @IsIn(webhookPaymentStatuses)
  status!: (typeof webhookPaymentStatuses)[number]

  @IsOptional()
  @IsString()
  provider?: string
}

