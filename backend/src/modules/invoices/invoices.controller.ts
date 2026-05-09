import { Body, Controller, Get, Param, Post, Put, Res, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import type { Response } from "express"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CancelInvoiceDto, CreateInvoiceDto, GenerateInvoicesDto, UpdateInvoiceDto } from "./dto/invoice.dto"
import { InvoiceAutomationSettingsDto } from "./dto/invoice-automation.dto"
import { InvoicesService } from "./invoices.service"

@ApiTags("invoices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions("invoices.read")
  list() {
    return this.invoicesService.list()
  }

  @Post()
  @RequirePermissions("invoices.write")
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("invoices.write")
  update(@Param("id") id: string, @Body() dto: UpdateInvoiceDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.update(id, dto, user.id)
  }

  @Post(":id/cancel")
  @RequirePermissions("invoices.write")
  cancel(@Param("id") id: string, @Body() dto: CancelInvoiceDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.cancel(id, dto, user.id)
  }

  @Get(":id/pdf")
  @RequirePermissions("invoices.read")
  async downloadPdf(@Param("id") id: string, @Res() response: Response) {
    const fileBuffer = await this.invoicesService.getPdfBuffer(id)
    response.setHeader("Content-Type", "application/pdf")
    response.setHeader("Content-Disposition", `attachment; filename=\"invoice-${id}.pdf\"`)
    response.send(fileBuffer)
  }

  @Post(":id/send")
  @RequirePermissions("invoices.write")
  send(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.invoicesService.sendInvoice(id, user.id)
  }

  @Post("generate")
  @RequirePermissions("invoices.write")
  generate(@Body() dto: GenerateInvoicesDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.generate(dto, user.id)
  }

  @Get("automation/settings")
  @RequirePermissions("invoices.read")
  getAutomationSettings() {
    return this.invoicesService.getAutomationSettings()
  }

  @Put("automation/settings")
  @RequirePermissions("invoices.write")
  updateAutomationSettings(@Body() dto: InvoiceAutomationSettingsDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.updateAutomationSettings(dto, user.id)
  }

  @Get(":id")
  @RequirePermissions("invoices.read")
  getById(@Param("id") id: string) {
    return this.invoicesService.getById(id)
  }
}
