import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { PaymentsService } from "./payments.service"
import { CreatePaymentDto, ListPaymentsQueryDto, UpdatePaymentDto } from "./dto/payment.dto"

@ApiTags("payments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions("payments.read")
  list() {
    return this.paymentsService.list()
  }

  @Get("page")
  @RequirePermissions("payments.read")
  listPage(@Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.listPage(query)
  }

  @Get("account-status/:clientId")
  @RequirePermissions("payments.read")
  accountStatus(@Param("clientId") clientId: string) {
    return this.paymentsService.getAccountStatus(clientId)
  }

  @Get("detail/:id")
  @RequirePermissions("payments.read")
  getById(@Param("id") id: string) {
    return this.paymentsService.getById(id)
  }

  @Post()
  @RequirePermissions("payments.manual.write")
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: { id: string }) {
    return this.paymentsService.create(dto, user.id)
  }

  @Put("detail/:id")
  @RequirePermissions("payments.manual.write")
  update(@Param("id") id: string, @Body() dto: UpdatePaymentDto, @CurrentUser() user: { id: string }) {
    return this.paymentsService.update(id, dto, user.id)
  }

  @Delete("detail/:id")
  @RequirePermissions("payments.manual.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.paymentsService.delete(id, user.id)
  }
}
