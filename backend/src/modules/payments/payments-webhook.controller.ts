import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import { validateEnv } from "@/config/env.validation"
import { PaymentsService } from "./payments.service"
import { PaymentWebhookDto } from "./dto/payment-webhook.dto"

@ApiTags("payments-webhooks")
@Controller("payments/webhooks")
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("provider")
  async receiveProviderPayment(
    @Body() dto: PaymentWebhookDto,
    @Headers("x-webhook-secret") incomingSecret?: string,
  ) {
    const env = validateEnv(process.env)
    if (env.PAYMENTS_WEBHOOK_SECRET) {
      const normalizedIncoming = incomingSecret?.trim()
      if (!normalizedIncoming || normalizedIncoming !== env.PAYMENTS_WEBHOOK_SECRET) {
        throw new UnauthorizedException("Invalid webhook secret")
      }
    }

    return this.paymentsService.registerFromWebhook(dto)
  }
}

