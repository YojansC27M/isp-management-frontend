import { Module } from "@nestjs/common"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { PaymentsController } from "./payments.controller"
import { PaymentsWebhookController } from "./payments-webhook.controller"
import { PaymentsService } from "./payments.service"

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
