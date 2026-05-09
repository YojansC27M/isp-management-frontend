import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService, type JwtSignOptions } from "@nestjs/jwt"
import { Prisma } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { PrismaService } from "@/common/prisma/prisma.service"
import type { AuthenticatedUserPayload } from "../auth/auth.types"
import { PortalCreateTicketDto } from "./dto/portal-create-ticket.dto"
import {
  getTicketAttachmentExtension,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_ATTACHMENT_COUNT,
  sanitizeOriginalAttachmentName,
  type UploadedTicketAttachment,
  TICKET_ATTACHMENT_UPLOAD_DIR,
} from "../tickets/ticket-attachment.constants"
import { getPrimaryTicketAttachment, getTicketAttachments } from "../tickets/ticket-attachment.mapper"

const toNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0)
const PORTAL_PASSWORD_POLICY_KEY_PREFIX = "portal_password_policy::"
const portalPasswordPolicyKey = (userId: string) => `${PORTAL_PASSWORD_POLICY_KEY_PREFIX}${userId}`

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getTicketAttachmentFilePath(fileName: string) {
    return join(process.cwd(), TICKET_ATTACHMENT_UPLOAD_DIR, fileName)
  }

  private async storeAttachment(file?: UploadedTicketAttachment | null) {
    if (!file) return null
    if (file.size > MAX_TICKET_ATTACHMENT_BYTES) {
      throw new BadRequestException("Attachment exceeds the allowed size")
    }

    const extension = getTicketAttachmentExtension(file.mimetype)
    const fileName = `${randomUUID()}${extension}`
    const filePath = this.getTicketAttachmentFilePath(fileName)
    const originalName = sanitizeOriginalAttachmentName(file.originalname)

    await mkdir(join(process.cwd(), TICKET_ATTACHMENT_UPLOAD_DIR), { recursive: true })
    await writeFile(filePath, file.buffer)

    return {
      fileName,
      originalName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    }
  }

  private async storeAttachments(files?: UploadedTicketAttachment[] | null) {
    if (!files?.length) return []
    if (files.length > MAX_TICKET_ATTACHMENT_COUNT) {
      throw new BadRequestException(`You can attach up to ${MAX_TICKET_ATTACHMENT_COUNT} files per ticket`)
    }

    const storedAttachments: Array<{
      fileName: string
      originalName: string
      mimeType: string
      sizeBytes: number
    }> = []

    try {
      for (const file of files) {
        const stored = await this.storeAttachment(file)
        if (stored) storedAttachments.push(stored)
      }
      return storedAttachments
    } catch (error) {
      await Promise.all(storedAttachments.map((attachment) => this.removeAttachment(attachment.fileName)))
      throw error
    }
  }

  private async removeAttachment(fileName?: string | null) {
    if (!fileName) return

    try {
      await unlink(this.getTicketAttachmentFilePath(fileName))
    } catch {
      // Best effort cleanup only.
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    })
    if (!user || user.role?.key !== "client") {
      await this.prisma.auditLog.create({
        data: {
          action: "portal.login_failed",
          entity: "client_portal_session",
          metadata: { reason: "user_not_allowed", email: normalizedEmail },
        },
      })
      throw new UnauthorizedException("Invalid credentials")
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "portal.login_failed",
          entity: "client_portal_session",
          metadata: { reason: "invalid_password", email: normalizedEmail },
        },
      })
      throw new UnauthorizedException("Invalid credentials")
    }

    const client = await this.resolveClientForEmail(normalizedEmail)
    if (!client) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "portal.login_failed",
          entity: "client_portal_session",
          metadata: { reason: "client_not_found", email: normalizedEmail },
        },
      })
      throw new UnauthorizedException("Client account is not available")
    }

    const mustChangePassword = await this.requiresPasswordChange(user.id)

    const payload: AuthenticatedUserPayload = {
      sub: user.id,
      jti: randomUUID(),
      email: user.email,
      name: user.name,
      roleKey: "client",
      clientId: client.id,
      permissions: [],
    }

    const expiresIn = (this.configService.get<string>("JWT_EXPIRES_IN") ?? "8h") as JwtSignOptions["expiresIn"]
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      expiresIn,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "portal.login_succeeded",
        entity: "client_portal_session",
        entityId: client.id,
        metadata: { clientId: client.id, email: normalizedEmail },
      },
    })

    return {
      token,
      clientId: client.id,
      expiresInSeconds: 8 * 60 * 60,
      mustChangePassword,
    }
  }

  async getProfile(userId: string, clientId: string) {
    await this.assertPasswordRotationCompleted(userId)
    const client = await this.getClientById(clientId)
    const [ticketsOpenCount, pendingInvoices, latestPayment] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          clientId,
          status: { in: ["open", "in_progress", "waiting"] },
        },
      }),
      this.prisma.invoice.findMany({
        where: { clientId, status: { in: ["pending", "overdue"] } },
        orderBy: { dueAt: "asc" },
      }),
      this.prisma.payment.findFirst({
        where: { clientId },
        orderBy: { paymentDate: "desc" },
      }),
    ])

    const balance = pendingInvoices.reduce((sum, item) => sum + toNumber(item.total), 0)

    return {
      id: client.id,
      name: client.name,
      email: client.email ?? "",
      plan: client.plan?.name ?? "",
      status: client.status as "active" | "suspended" | "inactive",
      ipAddress: client.ipAddress,
      serviceAddress: client.address ?? "",
      accountNumber: `ACC-${client.id.slice(-6).toUpperCase()}`,
      balance,
      openTickets: ticketsOpenCount,
      nextDueDate: pendingInvoices[0]?.dueAt.toISOString().slice(0, 10),
      lastPaymentDate: latestPayment?.paymentDate.toISOString().slice(0, 10),
      lastAccessAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      serviceStatus: client.status === "active" ? "online" : "limited",
    }
  }

  async getInvoices(userId: string, clientId: string) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)
    const portalBaseUrl = this.configService.get<string>("CLIENT_PORTAL_BASE_URL")?.trim() || "http://localhost:5173/client"
    const invoices = await this.prisma.invoice.findMany({
      where: { clientId },
      orderBy: { issuedAt: "desc" },
      take: 50,
    })

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: toNumber(invoice.total),
      dueDate: invoice.dueAt.toISOString().slice(0, 10),
      status: invoice.status as "pending" | "paid" | "overdue" | "cancelled",
      issueDate: invoice.issuedAt.toISOString().slice(0, 10),
      period: invoice.issuedAt.toISOString().slice(0, 7),
      paidAt: invoice.status === "paid" ? invoice.issuedAt.toISOString().slice(0, 10) : undefined,
      cancelledAt: invoice.cancelledAt ? invoice.cancelledAt.toISOString().slice(0, 10) : undefined,
      cancellationReason: invoice.cancellationReason ?? undefined,
      paymentReference: invoice.invoiceNumber,
      paymentLink: `${portalBaseUrl}/payments?invoice=${encodeURIComponent(invoice.invoiceNumber)}`,
      downloadUrl: `/api/v1/client-portal/invoices/${invoice.id}/pdf`,
    }))
  }

  async getPayments(userId: string, clientId: string) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)
    const payments = await this.prisma.payment.findMany({
      where: { clientId },
      orderBy: { paymentDate: "desc" },
      take: 50,
    })

    return payments.map((payment) => ({
      id: payment.id,
      amount: toNumber(payment.amount),
      paymentDate: payment.paymentDate.toISOString().slice(0, 10),
      method: payment.method as "card" | "transfer" | "cash" | "pse" | "other",
      status: payment.status === "paid" ? "paid" : payment.status === "overdue" ? "overdue" : "pending",
      invoiceNumber: payment.invoiceNumber,
      reference: `PAY-${payment.id.slice(-8).toUpperCase()}`,
      receiptUrl: `/api/v1/client-portal/payments/${payment.id}/receipt`,
    }))
  }

  async getTickets(userId: string, clientId: string) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)
    const tickets = await this.prisma.ticket.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return tickets.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status as "open" | "in_progress" | "waiting" | "resolved" | "closed",
      createdAt: ticket.createdAt.toISOString().slice(0, 10),
      priority: ticket.priority as "low" | "medium" | "high",
      updatedAt: ticket.updatedAt.toISOString().slice(0, 10),
      channel: "web" as const,
      messageCount: 1,
      attachment: getPrimaryTicketAttachment(ticket),
      attachments: getTicketAttachments(ticket),
    }))
  }

  async createTicket(userId: string, clientId: string, payload: PortalCreateTicketDto, attachments?: UploadedTicketAttachment[] | null) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)
    const storedAttachments = await this.storeAttachments(attachments)

    try {
      const ticket = await this.prisma.$transaction(async (prisma) => {
        const createdTicket = await prisma.ticket.create({
          data: {
            clientId,
            title: payload.title.trim(),
            description: payload.description.trim(),
            status: "open",
            priority: payload.priority,
            category: payload.category,
            assignedUserId: "",
            assignedUserName: "",
            assignedTechnicianId: "",
            assignedTechnicianName: "",
            attachmentFileName: storedAttachments[0]?.fileName ?? null,
            attachmentOriginalName: storedAttachments[0]?.originalName ?? null,
            attachmentMimeType: storedAttachments[0]?.mimeType ?? null,
            attachmentSizeBytes: storedAttachments[0]?.sizeBytes ?? null,
          },
        })

        if (storedAttachments.length > 0) {
          await prisma.ticketAttachment.createMany({
            data: storedAttachments.map((attachment) => ({
              ticketId: createdTicket.id,
              fileName: attachment.fileName,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
            })),
          })
        }

        return prisma.ticket.findUniqueOrThrow({
          where: { id: createdTicket.id },
          include: {
            attachments: {
              orderBy: { createdAt: "asc" },
            },
          },
        })
      })

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: "portal.ticket.create",
          entity: "ticket",
          entityId: ticket.id,
          metadata: {
            clientId,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            hasAttachment: storedAttachments.length > 0,
            attachmentCount: storedAttachments.length,
          },
        },
      })

      return {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status as "open" | "in_progress" | "waiting" | "resolved" | "closed",
        createdAt: ticket.createdAt.toISOString().slice(0, 10),
        priority: ticket.priority as "low" | "medium" | "high",
        updatedAt: ticket.updatedAt.toISOString().slice(0, 10),
        channel: "web" as const,
        messageCount: 1,
        attachment: getPrimaryTicketAttachment(ticket),
        attachments: getTicketAttachments(ticket),
      }
    } catch (error) {
      await Promise.all(storedAttachments.map((attachment) => this.removeAttachment(attachment.fileName)))
      throw error
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })
    if (!user || user.role?.key !== "client") {
      throw new UnauthorizedException("Client account is not available")
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!validPassword) {
      throw new UnauthorizedException("Current password is invalid")
    }
    if (currentPassword === newPassword) {
      throw new ForbiddenException("New password must be different")
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    await this.prisma.systemSetting.upsert({
      where: { key: portalPasswordPolicyKey(userId) },
      create: {
        key: portalPasswordPolicyKey(userId),
        value: {
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        },
      },
      update: {
        value: {
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        },
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "portal.password_changed",
        entity: "client_portal_user",
      },
    })

    const revokedAfterEpoch = Math.floor(Date.now() / 1000)
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "auth.logout_all",
        entity: "auth_session_scope",
        entityId: userId,
        metadata: {
          revokedAfterEpoch,
          reason: "password_changed",
          triggeredBy: "client_portal",
          loggedOutAt: new Date().toISOString(),
        },
      },
    })

    return { ok: true }
  }

  async getInvoicePdf(userId: string, clientId: string, invoiceId: string) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        clientId,
      },
      include: {
        client: true,
      },
    })
    if (!invoice) {
      throw new UnauthorizedException("Invoice is not available")
    }

    const amount = toNumber(invoice.total).toFixed(2)
    const lines = [
      "%PDF-1.1",
      "1 0 obj<<>>endobj",
      "2 0 obj<<>>endobj",
      "3 0 obj<</Length 180>>stream",
      `BT /F1 12 Tf 40 760 Td (Invoice ${invoice.invoiceNumber}) Tj ET`,
      `BT /F1 11 Tf 40 740 Td (Client ${invoice.client.name}) Tj ET`,
      `BT /F1 11 Tf 40 720 Td (Amount ${amount}) Tj ET`,
      `BT /F1 11 Tf 40 700 Td (Due ${invoice.dueAt.toISOString().slice(0, 10)}) Tj ET`,
      "endstream endobj",
      "4 0 obj<</Type /Page /Parent 5 0 R /Contents 3 0 R>>endobj",
      "5 0 obj<</Type /Pages /Kids [4 0 R] /Count 1>>endobj",
      "6 0 obj<</Type /Catalog /Pages 5 0 R>>endobj",
      "xref",
      "0 7",
      "0000000000 65535 f ",
      "trailer<</Size 7 /Root 6 0 R>>",
      "startxref",
      "0",
      "%%EOF",
    ]

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "portal.invoice_pdf.download",
        entity: "invoice",
        entityId: invoice.id,
        metadata: {
          clientId,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
    })

    return Buffer.from(lines.join("\n"), "utf-8")
  }

  async getPaymentReceiptPdf(userId: string, clientId: string, paymentId: string) {
    await this.assertPasswordRotationCompleted(userId)
    await this.getClientById(clientId)

    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        clientId,
      },
      include: {
        client: true,
      },
    })
    if (!payment) {
      throw new UnauthorizedException("Payment receipt is not available")
    }

    const amount = toNumber(payment.amount).toFixed(2)
    const lines = [
      "%PDF-1.1",
      "1 0 obj<<>>endobj",
      "2 0 obj<<>>endobj",
      "3 0 obj<</Length 220>>stream",
      `BT /F1 12 Tf 40 760 Td (Payment Receipt ${payment.id.slice(-8).toUpperCase()}) Tj ET`,
      `BT /F1 11 Tf 40 740 Td (Client ${payment.client.name}) Tj ET`,
      `BT /F1 11 Tf 40 720 Td (Invoice ${payment.invoiceNumber}) Tj ET`,
      `BT /F1 11 Tf 40 700 Td (Amount ${amount}) Tj ET`,
      `BT /F1 11 Tf 40 680 Td (Date ${payment.paymentDate.toISOString().slice(0, 10)}) Tj ET`,
      `BT /F1 11 Tf 40 660 Td (Method ${payment.method}) Tj ET`,
      "endstream endobj",
      "4 0 obj<</Type /Page /Parent 5 0 R /Contents 3 0 R>>endobj",
      "5 0 obj<</Type /Pages /Kids [4 0 R] /Count 1>>endobj",
      "6 0 obj<</Type /Catalog /Pages 5 0 R>>endobj",
      "xref",
      "0 7",
      "0000000000 65535 f ",
      "trailer<</Size 7 /Root 6 0 R>>",
      "startxref",
      "0",
      "%%EOF",
    ]

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "portal.payment_receipt.download",
        entity: "payment",
        entityId: payment.id,
        metadata: {
          clientId,
          invoiceNumber: payment.invoiceNumber,
        },
      },
    })

    return Buffer.from(lines.join("\n"), "utf-8")
  }

  private async resolveClientForEmail(email: string) {
    return this.prisma.client.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: { in: ["active", "suspended"] },
      },
    })
  }

  private async getClientById(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    })
    if (!client) {
      throw new UnauthorizedException("Client session is invalid")
    }
    return client
  }

  private async requiresPasswordChange(userId: string) {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: portalPasswordPolicyKey(userId) },
    })
    if (!row || !row.value || typeof row.value !== "object" || Array.isArray(row.value)) {
      return false
    }
    const raw = (row.value as Record<string, unknown>)["mustChangePassword"]
    return raw === true
  }

  private async assertPasswordRotationCompleted(userId: string) {
    const mustChange = await this.requiresPasswordChange(userId)
    if (mustChange) {
      throw new ForbiddenException("Password change required")
    }
  }
}
