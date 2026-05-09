import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { RunBillingAutomationDto } from "./dto/run-billing-automation.dto"
import { BillingAutomationService } from "./billing-automation.service"

@ApiTags("billing-automation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("billing-automation")
export class BillingAutomationController {
  constructor(private readonly billingAutomationService: BillingAutomationService) {}

  @Get("status")
  @RequirePermissions("invoices.write")
  getStatus() {
    return this.billingAutomationService.getStatus()
  }

  @Post("run")
  @RequirePermissions("invoices.write")
  run(@Body() dto: RunBillingAutomationDto) {
    return this.billingAutomationService.runNow(dto.at)
  }
}

