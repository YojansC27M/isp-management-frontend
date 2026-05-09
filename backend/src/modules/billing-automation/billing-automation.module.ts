import { Module } from "@nestjs/common"
import { InvoicesModule } from "@/modules/invoices/invoices.module"
import { BillingAutomationController } from "./billing-automation.controller"
import { BillingAutomationService } from "./billing-automation.service"

@Module({
  imports: [InvoicesModule],
  controllers: [BillingAutomationController],
  providers: [BillingAutomationService],
})
export class BillingAutomationModule {}

