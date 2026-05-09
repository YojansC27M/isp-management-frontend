import { BadRequestException, Body, Controller, Get, Param, Post, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common"
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger"
import type { Response } from "express"
import { FilesInterceptor } from "@nestjs/platform-express"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { memoryStorage } from "multer"
import { PortalChangePasswordDto } from "./dto/portal-change-password.dto"
import { PortalCreateTicketDto } from "./dto/portal-create-ticket.dto"
import { PortalLoginDto } from "./dto/portal-login.dto"
import { PortalService } from "./portal.service"
import {
  ALLOWED_TICKET_ATTACHMENT_MIME_TYPES,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_ATTACHMENT_COUNT,
  type UploadedTicketAttachment,
} from "../tickets/ticket-attachment.constants"

@ApiTags("client-portal")
@Controller("client-portal")
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post("login")
  login(@Body() payload: PortalLoginDto) {
    return this.portalService.login(payload.email, payload.password)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@CurrentUser() user: { id: string; clientId?: string }) {
    return this.portalService.getProfile(user.id, user.clientId ?? "")
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("invoices")
  getInvoices(@CurrentUser() user: { id: string; clientId?: string }) {
    return this.portalService.getInvoices(user.id, user.clientId ?? "")
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("payments")
  getPayments(@CurrentUser() user: { id: string; clientId?: string }) {
    return this.portalService.getPayments(user.id, user.clientId ?? "")
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("tickets")
  getTickets(@CurrentUser() user: { id: string; clientId?: string }) {
    return this.portalService.getTickets(user.id, user.clientId ?? "")
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FilesInterceptor("attachment", MAX_TICKET_ATTACHMENT_COUNT, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TICKET_ATTACHMENT_BYTES, files: MAX_TICKET_ATTACHMENT_COUNT },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_TICKET_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException("Unsupported ticket attachment type"), false)
          return
        }
        callback(null, true)
      },
    }),
  )
  @Post("tickets")
  createTicket(
    @CurrentUser() user: { id: string; clientId?: string },
    @Body() payload: PortalCreateTicketDto,
    @UploadedFiles() attachments: UploadedTicketAttachment[] | undefined,
  ) {
    return this.portalService.createTicket(user.id, user.clientId ?? "", payload, attachments)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("invoices/:invoiceId/pdf")
  async downloadInvoicePdf(
    @Param("invoiceId") invoiceId: string,
    @CurrentUser() user: { id: string; clientId?: string },
    @Res() response: Response,
  ) {
    const pdfBuffer = await this.portalService.getInvoicePdf(user.id, user.clientId ?? "", invoiceId)
    response.setHeader("Content-Type", "application/pdf")
    response.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceId}.pdf"`)
    response.send(pdfBuffer)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("payments/:paymentId/receipt")
  async downloadPaymentReceipt(
    @Param("paymentId") paymentId: string,
    @CurrentUser() user: { id: string; clientId?: string },
    @Res() response: Response,
  ) {
    const pdfBuffer = await this.portalService.getPaymentReceiptPdf(user.id, user.clientId ?? "", paymentId)
    response.setHeader("Content-Type", "application/pdf")
    response.setHeader("Content-Disposition", `attachment; filename="payment-${paymentId}.pdf"`)
    response.send(pdfBuffer)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  changePassword(@CurrentUser() user: { id: string }, @Body() payload: PortalChangePasswordDto) {
    return this.portalService.changePassword(user.id, payload.currentPassword, payload.newPassword)
  }
}
