import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CancelInvoiceDto, CreateInvoiceDto, GenerateInvoicesDto, UpdateInvoiceDto } from "./dto/invoice.dto"
import { InvoiceAutomationSettingsDto } from "./dto/invoice-automation.dto"

const invoiceInclude = {
  client: true,
} as const
const INVOICE_AUTOMATION_SETTINGS_KEY = "invoice_automation_settings"
const DEFAULT_INVOICE_AUTOMATION_SETTINGS = {
  cutDay: 5,
  prefix: "INV",
  nextCorrelative: 1004,
}

const toNumber = (value: Prisma.Decimal | number) => Number(value)
const mapInvoice = (invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>) => ({
  id: invoice.id,
  clientId: invoice.clientId,
  clientName: invoice.client.name,
  invoiceNumber: invoice.invoiceNumber,
  accountNumber: `ACC-${invoice.clientId.slice(-6).toUpperCase()}`,
  paymentReference: invoice.invoiceNumber,
  paymentLink: `/client/payments?invoice=${encodeURIComponent(invoice.invoiceNumber)}`,
  amount: toNumber(invoice.total),
  issueDate: invoice.issuedAt.toISOString(),
  dueDate: invoice.dueAt.toISOString(),
  status: invoice.status,
  cancelledAt: invoice.cancelledAt ? invoice.cancelledAt.toISOString() : null,
  cancellationReason: invoice.cancellationReason ?? null,
})

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getInvoiceEntity(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    })

    if (!invoice) {
      throw new NotFoundException("Invoice not found")
    }

    return invoice
  }

  private async ensureInvoiceNumberAvailable(invoiceNumber: string, ignoreInvoiceId?: string) {
    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      select: { id: true },
    })
    if (existing && existing.id !== ignoreInvoiceId) {
      throw new BadRequestException("Invoice number already exists")
    }
  }

  private async countLinkedPayments(clientId: string, invoiceNumber: string) {
    return this.prisma.payment.count({
      where: {
        clientId,
        invoiceNumber,
      },
    })
  }

  private assertEditableInvoice(invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>) {
    if (invoice.status === "cancelled") {
      throw new BadRequestException("Cancelled invoices cannot be edited")
    }
  }

  private buildInvoiceNumber(clientId: string, prefix = "INV", correlative?: number) {
    if (typeof correlative === "number") {
      return `${prefix}-${String(correlative).padStart(6, "0")}`
    }
    return `${prefix}-${Date.now()}-${clientId.slice(-6).toUpperCase()}`
  }

  private normalizeAutomationSettings(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ...DEFAULT_INVOICE_AUTOMATION_SETTINGS }
    }
    const payload = value as Record<string, unknown>
    const cutDayRaw = Number(payload["cutDay"])
    const nextCorrelativeRaw = Number(payload["nextCorrelative"])
    const prefixRaw = typeof payload["prefix"] === "string" ? payload["prefix"].trim().toUpperCase() : ""
    return {
      cutDay: Number.isFinite(cutDayRaw) && cutDayRaw >= 1 && cutDayRaw <= 28 ? Math.floor(cutDayRaw) : DEFAULT_INVOICE_AUTOMATION_SETTINGS.cutDay,
      prefix: prefixRaw.length > 0 ? prefixRaw : DEFAULT_INVOICE_AUTOMATION_SETTINGS.prefix,
      nextCorrelative:
        Number.isFinite(nextCorrelativeRaw) && nextCorrelativeRaw >= 1
          ? Math.floor(nextCorrelativeRaw)
          : DEFAULT_INVOICE_AUTOMATION_SETTINGS.nextCorrelative,
    }
  }

  async getAutomationSettings() {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: INVOICE_AUTOMATION_SETTINGS_KEY },
    })
    return this.normalizeAutomationSettings(row?.value)
  }

  async updateAutomationSettings(dto: InvoiceAutomationSettingsDto, actorId?: string) {
    const next = {
      cutDay: Math.min(28, Math.max(1, Math.floor(dto.cutDay))),
      prefix: dto.prefix.trim().toUpperCase(),
      nextCorrelative: Math.max(1, Math.floor(dto.nextCorrelative)),
    }

    await this.prisma.systemSetting.upsert({
      where: { key: INVOICE_AUTOMATION_SETTINGS_KEY },
      update: { value: next },
      create: { key: INVOICE_AUTOMATION_SETTINGS_KEY, value: next },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.automation.settings.update",
        entity: "invoice_automation_settings",
        metadata: next,
      },
    })

    return next
  }

  async list() {
    const invoices = await this.prisma.invoice.findMany({
      orderBy: [{ issuedAt: "desc" }],
      include: invoiceInclude,
    })

    return invoices.map(mapInvoice)
  }

  async getById(id: string) {
    const invoice = await this.getInvoiceEntity(id)
    return mapInvoice(invoice)
  }

  async create(dto: CreateInvoiceDto, actorId?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } })
    if (!client) {
      throw new NotFoundException("Client not found")
    }

    const automation = await this.getAutomationSettings()
    const invoiceNumber = dto.invoiceNumber?.trim() || this.buildInvoiceNumber(dto.clientId, automation.prefix)
    await this.ensureInvoiceNumberAvailable(invoiceNumber)

    const status = dto.status ?? "pending"
    const cancelledAt = status === "cancelled" ? new Date() : null
    const invoice = await this.prisma.invoice.create({
      data: {
        clientId: dto.clientId,
        invoiceNumber,
        total: new Prisma.Decimal(dto.amount),
        status,
        issuedAt: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueAt: new Date(dto.dueDate),
        cancelledAt,
        cancellationReason: status === "cancelled" ? "Created as cancelled" : null,
      },
      include: invoiceInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.create",
        entity: "invoice",
        entityId: invoice.id,
        metadata: {
          clientId: invoice.clientId,
          invoiceNumber: invoice.invoiceNumber,
          amount: toNumber(invoice.total),
        },
      },
    })

    return mapInvoice(invoice)
  }

  async update(id: string, dto: UpdateInvoiceDto, actorId?: string) {
    const invoice = await this.getInvoiceEntity(id)
    this.assertEditableInvoice(invoice)

    const nextClientId = dto.clientId?.trim() || invoice.clientId
    const nextInvoiceNumber = dto.invoiceNumber?.trim() || invoice.invoiceNumber
    const nextAmount = typeof dto.amount === "number" ? new Prisma.Decimal(dto.amount) : invoice.total
    const nextIssueDate = dto.issueDate ? new Date(dto.issueDate) : invoice.issuedAt
    const nextDueDate = dto.dueDate ? new Date(dto.dueDate) : invoice.dueAt
    const nextStatus = dto.status ?? invoice.status

    if (dto.clientId || dto.invoiceNumber || typeof dto.amount === "number") {
      const linkedPayments = await this.countLinkedPayments(invoice.clientId, invoice.invoiceNumber)
      if (linkedPayments > 0) {
        if (nextClientId !== invoice.clientId || nextInvoiceNumber !== invoice.invoiceNumber) {
          throw new BadRequestException("Invoices with payments cannot change client or invoice number")
        }
        if (typeof dto.amount === "number" && !nextAmount.equals(invoice.total)) {
          throw new BadRequestException("Invoices with payments cannot change amount")
        }
      }
    }

    await this.ensureInvoiceNumberAvailable(nextInvoiceNumber, invoice.id)

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        clientId: nextClientId,
        invoiceNumber: nextInvoiceNumber,
        total: nextAmount,
        issuedAt: nextIssueDate,
        dueAt: nextDueDate,
        status: nextStatus,
        cancelledAt: nextStatus === "cancelled" ? invoice.cancelledAt ?? new Date() : null,
        cancellationReason: nextStatus === "cancelled" ? invoice.cancellationReason ?? "Manual status update" : null,
      },
      include: invoiceInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.update",
        entity: "invoice",
        entityId: updated.id,
        metadata: {
          previousStatus: invoice.status,
          nextStatus: updated.status,
          previousClientId: invoice.clientId,
          nextClientId: updated.clientId,
          previousInvoiceNumber: invoice.invoiceNumber,
          nextInvoiceNumber: updated.invoiceNumber,
        },
      },
    })

    return mapInvoice(updated)
  }

  async cancel(id: string, dto: CancelInvoiceDto, actorId?: string) {
    const invoice = await this.getInvoiceEntity(id)
    if (invoice.status === "cancelled") {
      throw new BadRequestException("Invoice is already cancelled")
    }

    const cancelled = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: dto.reason.trim(),
      },
      include: invoiceInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.cancel",
        entity: "invoice",
        entityId: cancelled.id,
        metadata: {
          invoiceNumber: cancelled.invoiceNumber,
          reason: cancelled.cancellationReason,
          previousStatus: invoice.status,
        },
      },
    })

    return mapInvoice(cancelled)
  }

  async getPdfBuffer(id: string) {
    const invoice = await this.getById(id)
    const safeAmount = Number(invoice.amount).toFixed(2)
    const lines = [
      "%PDF-1.1",
      "1 0 obj<<>>endobj",
      "2 0 obj<<>>endobj",
      "3 0 obj<</Length 110>>stream",
      `BT /F1 12 Tf 40 760 Td (Invoice ${invoice.invoiceNumber}) Tj ET`,
      `BT /F1 11 Tf 40 740 Td (Amount ${safeAmount}) Tj ET`,
      `BT /F1 11 Tf 40 720 Td (Status ${invoice.status}) Tj ET`,
      invoice.status === "cancelled" && invoice.cancellationReason
        ? `BT /F1 11 Tf 40 700 Td (Cancelled ${invoice.cancellationReason}) Tj ET`
        : "",
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

    return Buffer.from(lines.join("\n"), "utf-8")
  }

  async sendInvoice(id: string, actorId?: string) {
    const invoice = await this.getInvoiceEntity(id)
    this.assertEditableInvoice(invoice)
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.send",
        entity: "invoice",
        entityId: id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          sentAt: new Date().toISOString(),
        },
      },
    })

    return {
      ok: true,
      id,
      sentAt: new Date().toISOString(),
    }
  }

  async generate(dto: GenerateInvoicesDto, actorId?: string) {
    const automation = await this.getAutomationSettings()
    const referenceDate = dto.referenceDate ? new Date(dto.referenceDate) : new Date()
    const dueDays = dto.dueDays ?? 10
    const defaultAmount = dto.defaultAmount ?? 0
    const onlyActiveClients = dto.onlyActiveClients ?? true

    const clients = await this.prisma.client.findMany({
      where: onlyActiveClients ? { status: "active" } : undefined,
      orderBy: [{ createdAt: "asc" }],
    })

    const createdIds: string[] = []
    let nextCorrelative = automation.nextCorrelative
    for (const client of clients) {
      let invoiceNumber = this.buildInvoiceNumber(client.id, automation.prefix, nextCorrelative)
      let existing = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
      })
      while (existing) {
        nextCorrelative += 1
        invoiceNumber = this.buildInvoiceNumber(client.id, automation.prefix, nextCorrelative)
        existing = await this.prisma.invoice.findUnique({
          where: { invoiceNumber },
        })
      }
      nextCorrelative += 1

      const latestInvoice = await this.prisma.invoice.findFirst({
        where: { clientId: client.id },
        orderBy: [{ issuedAt: "desc" }],
      })

      const created = await this.prisma.invoice.create({
        data: {
          clientId: client.id,
          invoiceNumber,
          total: latestInvoice?.total ?? new Prisma.Decimal(defaultAmount),
          status: "pending",
          issuedAt: referenceDate,
          dueAt: new Date(referenceDate.getTime() + dueDays * 24 * 60 * 60 * 1000),
        },
      })
      createdIds.push(created.id)
    }

    await this.prisma.systemSetting.upsert({
      where: { key: INVOICE_AUTOMATION_SETTINGS_KEY },
      update: {
        value: {
          cutDay: automation.cutDay,
          prefix: automation.prefix,
          nextCorrelative,
        },
      },
      create: {
        key: INVOICE_AUTOMATION_SETTINGS_KEY,
        value: {
          cutDay: automation.cutDay,
          prefix: automation.prefix,
          nextCorrelative,
        },
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "invoices.generate",
        entity: "invoice_batch",
        metadata: {
          totalCreated: createdIds.length,
          referenceDate: referenceDate.toISOString(),
          dueDays,
          onlyActiveClients,
        },
      },
    })

    return {
      ok: true,
      created: createdIds.length,
      invoiceIds: createdIds,
    }
  }
}
