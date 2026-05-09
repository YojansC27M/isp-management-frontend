import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreatePaymentDto, ListPaymentsQueryDto, UpdatePaymentDto } from "./dto/payment.dto"
import { PaymentWebhookDto } from "./dto/payment-webhook.dto"

const paymentInclude = {
  client: true,
} as const

const toNumber = (value: Prisma.Decimal | number) => Number(value)

const mapPayment = (payment: Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>) => ({
  id: payment.id,
  clientId: payment.clientId,
  clientName: payment.client.name,
  invoiceNumber: payment.invoiceNumber,
  amount: toNumber(payment.amount),
  paymentMethod: payment.method,
  paymentDate: payment.paymentDate.toISOString(),
  status: payment.status,
})

const listSortFieldMap: Record<NonNullable<ListPaymentsQueryDto["sortBy"]>, "paymentDate" | "amount" | "status" | "invoiceNumber" | "createdAt"> = {
  paymentDate: "paymentDate",
  amount: "amount",
  status: "status",
  invoiceNumber: "invoiceNumber",
  createdAt: "createdAt",
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getInvoiceByNumber(clientId: string, invoiceNumber: string) {
    return this.prisma.invoice.findFirst({
      where: {
        clientId,
        invoiceNumber,
      },
    })
  }

  private async reconcileInvoiceStatus(clientId: string, invoiceNumber: string) {
    const invoice = await this.getInvoiceByNumber(clientId, invoiceNumber)
    if (!invoice) return
    if (invoice.status === "cancelled") return

    const payments = await this.prisma.payment.findMany({
      where: {
        clientId,
        invoiceNumber,
      },
    })

    const paidAmount = payments.reduce((sum, payment) => {
      const paymentAmount = toNumber(payment.amount)
      if (payment.status === "paid") return sum + paymentAmount
      if (payment.status === "refunded") return sum - paymentAmount
      return sum
    }, 0)

    const invoiceAmount = toNumber(invoice.total)
    const nextStatus = paidAmount >= invoiceAmount
      ? "paid"
      : invoice.dueAt.getTime() < Date.now()
        ? "overdue"
        : "pending"

    if (invoice.status !== nextStatus) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: nextStatus },
      })
    }
  }

  async list() {
    const payments = await this.prisma.payment.findMany({
      orderBy: [{ paymentDate: "desc" }],
      include: paymentInclude,
    })
    return payments.map(mapPayment)
  }

  async listPage(query: ListPaymentsQueryDto) {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 25
    const skip = (page - 1) * perPage
    const sortBy = listSortFieldMap[query.sortBy ?? "paymentDate"]
    const sortDir = query.sortDir ?? "desc"
    const search = query.search?.trim()

    const where: Prisma.PaymentWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [{ [sortBy]: sortDir }],
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ])

    return {
      items: rows.map(mapPayment),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    }
  }

  async getById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: paymentInclude,
    })

    if (!payment) {
      throw new NotFoundException("Payment not found")
    }

    return mapPayment(payment)
  }

  async create(dto: CreatePaymentDto, actorId?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } })
    if (!client) {
      throw new NotFoundException("Client not found")
    }
    const invoiceNumber = dto.invoiceNumber.trim()
    const invoice = await this.getInvoiceByNumber(dto.clientId, invoiceNumber)
    if (!invoice) {
      throw new NotFoundException("Invoice not found for client")
    }
    if (invoice.status === "cancelled") {
      throw new BadRequestException("Invoice is cancelled")
    }

    const payment = await this.prisma.payment.create({
      data: {
        clientId: dto.clientId,
        invoiceNumber,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.paymentMethod,
        paymentDate: new Date(dto.paymentDate),
        status: dto.status,
      },
      include: paymentInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "payments.create",
        entity: "payment",
        entityId: payment.id,
        metadata: {
          clientId: payment.clientId,
          amount: toNumber(payment.amount),
          status: payment.status,
        },
      },
    })
    await this.reconcileInvoiceStatus(payment.clientId, payment.invoiceNumber)

    return mapPayment(payment)
  }

  async update(id: string, dto: UpdatePaymentDto, actorId?: string) {
    const existing = await this.getById(id)
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } })
    if (!client) {
      throw new NotFoundException("Client not found")
    }
    const invoiceNumber = dto.invoiceNumber.trim()
    const invoice = await this.getInvoiceByNumber(dto.clientId, invoiceNumber)
    if (!invoice) {
      throw new NotFoundException("Invoice not found for client")
    }
    if (invoice.status === "cancelled") {
      throw new BadRequestException("Invoice is cancelled")
    }

    const payment = await this.prisma.payment.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        invoiceNumber,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.paymentMethod,
        paymentDate: new Date(dto.paymentDate),
        status: dto.status,
      },
      include: paymentInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "payments.update",
        entity: "payment",
        entityId: payment.id,
        metadata: {
          clientId: payment.clientId,
          amount: toNumber(payment.amount),
          status: payment.status,
        },
      },
    })

    if (existing.clientId !== payment.clientId || existing.invoiceNumber !== payment.invoiceNumber) {
      await this.reconcileInvoiceStatus(existing.clientId, existing.invoiceNumber)
    }
    await this.reconcileInvoiceStatus(payment.clientId, payment.invoiceNumber)

    return mapPayment(payment)
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id)
    await this.prisma.payment.delete({ where: { id } })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "payments.delete",
        entity: "payment",
        entityId: id,
      },
    })
    await this.reconcileInvoiceStatus(existing.clientId, existing.invoiceNumber)

    return { ok: true }
  }

  async getAccountStatus(clientId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { clientId },
      orderBy: [{ dueAt: "asc" }],
      include: paymentInclude,
    })

    if (invoices.length === 0) {
      return []
    }

    return invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueAt.toISOString(),
      amount: toNumber(invoice.total),
      status: invoice.status,
      cancelledAt: invoice.cancelledAt ? invoice.cancelledAt.toISOString() : null,
      cancellationReason: invoice.cancellationReason ?? null,
    }))
  }

  async registerFromWebhook(dto: PaymentWebhookDto) {
    if (!["paid", "refunded"].includes(dto.status)) {
      await this.prisma.auditLog.create({
        data: {
          action: "payments.webhook.ignored",
          entity: "payment_webhook",
          metadata: {
            externalTransactionId: dto.externalTransactionId,
            invoiceNumber: dto.invoiceNumber,
            clientId: dto.clientId,
            status: dto.status,
            provider: dto.provider ?? "unknown",
          },
        },
      })
      return { ok: true, registered: false, reason: "status_not_registerable" as const }
    }

    const invoice = dto.clientId
      ? await this.prisma.invoice.findFirst({
          where: {
            clientId: dto.clientId,
            invoiceNumber: dto.invoiceNumber.trim(),
          },
        })
      : await this.prisma.invoice.findUnique({
          where: {
            invoiceNumber: dto.invoiceNumber.trim(),
          },
        })

    if (!invoice) {
      throw new NotFoundException("Invoice not found for webhook payload")
    }
    if (invoice.status === "cancelled") {
      throw new BadRequestException("Invoice is cancelled")
    }

    const paymentDate = new Date(dto.paymentDate)
    const amount = new Prisma.Decimal(dto.amount)
    const method = dto.paymentMethod === "other" ? "other" : dto.paymentMethod
    const normalizedStatus = dto.status === "paid" ? "paid" : "refunded"

    const existing = await this.prisma.payment.findFirst({
      where: {
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        method,
        paymentDate,
        status: normalizedStatus,
      },
      include: paymentInclude,
    })

    if (existing) {
      return {
        ok: true,
        registered: false,
        reason: "duplicate" as const,
        payment: mapPayment(existing),
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        method,
        paymentDate,
        status: normalizedStatus,
      },
      include: paymentInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        action: "payments.webhook.create",
        entity: "payment",
        entityId: payment.id,
        metadata: {
          externalTransactionId: dto.externalTransactionId,
          provider: dto.provider ?? "unknown",
          status: dto.status,
          method: dto.paymentMethod,
          clientId: payment.clientId,
          invoiceNumber: payment.invoiceNumber,
          amount: toNumber(payment.amount),
        },
      },
    })

    await this.reconcileInvoiceStatus(payment.clientId, payment.invoiceNumber)

    return {
      ok: true,
      registered: true,
      payment: mapPayment(payment),
    }
  }
}
