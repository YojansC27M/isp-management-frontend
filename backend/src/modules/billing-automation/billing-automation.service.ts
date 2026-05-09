import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { InvoicesService } from "@/modules/invoices/invoices.service"

interface BillingRunSummary {
  runAt: string
  trigger: "manual" | "interval"
  generatedInvoices: number
  remindersSent: number
  remindersSkipped: number
}

interface NotificationPayload {
  reminderType: string
  channel: "email" | "whatsapp"
  to: string
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  accountNumber: string
  paymentReference: string
  paymentLink: string
}

const MS_PER_DAY = 86_400_000
@Injectable()
export class BillingAutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingAutomationService.name)
  private ticker: NodeJS.Timeout | null = null
  private running = false
  private lastRun: BillingRunSummary | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly invoicesService: InvoicesService,
  ) {}

  onModuleInit() {
    const enabled = this.readBooleanEnv("BILLING_AUTOMATION_ENABLED", true)
    if (!enabled) return

    const intervalMinutes = this.readNumberEnv("BILLING_AUTOMATION_INTERVAL_MINUTES", 60)
    const intervalMs = Math.max(5, intervalMinutes) * 60_000
    this.ticker = setInterval(() => {
      void this.runCycle("interval").catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown automation error"
        this.logger.error(`Billing automation cycle failed: ${message}`)
      })
    }, intervalMs)
  }

  onModuleDestroy() {
    if (this.ticker) {
      clearInterval(this.ticker)
      this.ticker = null
    }
  }

  getStatus() {
    return {
      enabled: this.readBooleanEnv("BILLING_AUTOMATION_ENABLED", true),
      intervalMinutes: this.readNumberEnv("BILLING_AUTOMATION_INTERVAL_MINUTES", 60),
      running: this.running,
      lastRun: this.lastRun,
    }
  }

  async runNow(at?: string) {
    const referenceDate = at ? new Date(at) : undefined
    return this.runCycle("manual", referenceDate)
  }

  private async runCycle(trigger: "manual" | "interval", referenceDate = new Date()) {
    if (this.running) {
      return {
        skipped: true,
        reason: "already_running" as const,
        status: this.getStatus(),
      }
    }

    this.running = true
    try {
      const generatedInvoices = await this.runMonthlyGeneration(referenceDate)
      const reminderResult = await this.runDueReminders(referenceDate)
      const summary: BillingRunSummary = {
        runAt: new Date().toISOString(),
        trigger,
        generatedInvoices,
        remindersSent: reminderResult.sent,
        remindersSkipped: reminderResult.skipped,
      }
      this.lastRun = summary

      await this.prisma.auditLog.create({
        data: {
          action: "billing.automation.run",
          entity: "billing_automation",
          metadata: summary as unknown as Prisma.JsonObject,
        },
      })

      return { ok: true, ...summary }
    } finally {
      this.running = false
    }
  }

  private async runMonthlyGeneration(referenceDate: Date) {
    const invoiceAutomationSettings = await this.invoicesService.getAutomationSettings()
    const cutDay = invoiceAutomationSettings.cutDay
    if (referenceDate.getDate() < cutDay) return 0

    const year = referenceDate.getUTCFullYear()
    const month = String(referenceDate.getUTCMonth() + 1).padStart(2, "0")
    const monthKey = `${year}-${month}`
    const lockKey = `billing_automation::generate::${monthKey}`
    const locked = await this.tryCreateUniqueLock(lockKey, { monthKey, createdAt: new Date().toISOString() })
    if (!locked) return 0

    const dueDays = this.readNumberEnv("BILLING_DUE_DAYS", 10)
    const run = await this.invoicesService.generate(
      {
        referenceDate: referenceDate.toISOString(),
        dueDays,
        onlyActiveClients: true,
      },
      undefined,
    )
    return run.created
  }

  private async runDueReminders(referenceDate: Date) {
    const portalBaseUrl = this.configService.get<string>("CLIENT_PORTAL_BASE_URL")?.trim() || "http://localhost:5173/client"
    const startOfToday = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()))
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          in: ["pending", "overdue"],
        },
      },
      include: {
        client: true,
      },
    })

    let sent = 0
    let skipped = 0

    for (const invoice of invoices) {
      const startOfDueDate = new Date(Date.UTC(invoice.dueAt.getUTCFullYear(), invoice.dueAt.getUTCMonth(), invoice.dueAt.getUTCDate()))
      const daysUntilDue = Math.floor((startOfDueDate.getTime() - startOfToday.getTime()) / MS_PER_DAY)
      const reminderType = this.resolveReminderType(invoice.status, daysUntilDue)
      if (!reminderType) continue

      const lockKey = `billing_automation::reminder::${invoice.id}::${reminderType}::${startOfToday.toISOString().slice(0, 10)}`
      const locked = await this.tryCreateUniqueLock(lockKey, {
        invoiceId: invoice.id,
        reminderType,
        runDate: startOfToday.toISOString(),
      })
      if (!locked) {
        skipped += 1
        continue
      }

      const accountNumber = `ACC-${invoice.client.id.slice(-6).toUpperCase()}`
      const paymentReference = invoice.invoiceNumber
      const paymentLink = `${portalBaseUrl}/payments?invoice=${encodeURIComponent(invoice.invoiceNumber)}`
      const deliveries: NotificationPayload[] = []
      if (invoice.client.email) {
        deliveries.push({
          reminderType,
          channel: "email",
          to: invoice.client.email,
          clientName: invoice.client.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.total),
          dueDate: invoice.dueAt.toISOString(),
          accountNumber,
          paymentReference,
          paymentLink,
        })
      }
      if (invoice.client.phone) {
        deliveries.push({
          reminderType,
          channel: "whatsapp",
          to: invoice.client.phone,
          clientName: invoice.client.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.total),
          dueDate: invoice.dueAt.toISOString(),
          accountNumber,
          paymentReference,
          paymentLink,
        })
      }

      if (deliveries.length === 0) {
        skipped += 1
        await this.prisma.auditLog.create({
          data: {
            action: "billing.reminder.skipped",
            entity: "invoice",
            entityId: invoice.id,
            metadata: {
              reason: "missing_client_contact",
              reminderType,
              accountNumber,
              paymentReference,
              paymentLink,
            },
          },
        })
        continue
      }

      for (const delivery of deliveries) {
        const result = await this.dispatchNotification(delivery)
        if (result.sent) {
          sent += 1
          await this.prisma.auditLog.create({
            data: {
              action: "billing.reminder.sent",
              entity: "invoice",
              entityId: invoice.id,
              metadata: delivery as unknown as Prisma.JsonObject,
            },
          })
        } else {
          skipped += 1
          await this.prisma.auditLog.create({
            data: {
              action: "billing.reminder.skipped",
              entity: "invoice",
              entityId: invoice.id,
              metadata: {
                ...delivery,
                reason: result.reason,
              } as unknown as Prisma.JsonObject,
            },
          })
        }
      }
    }

    return { sent, skipped }
  }

  private resolveReminderType(status: string, daysUntilDue: number) {
    if (status === "pending" && [5, 2, 0].includes(daysUntilDue)) {
      return `due_${daysUntilDue}`
    }

    if (status === "overdue") {
      const daysOverdue = Math.abs(Math.min(daysUntilDue, 0))
      if (daysOverdue === 1 || (daysOverdue > 1 && daysOverdue % 7 === 0)) {
        return `overdue_${daysOverdue}`
      }
    }

    return null
  }

  private readBooleanEnv(name: string, fallback: boolean) {
    const value = this.configService.get<string>(name)
    if (!value) return fallback
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
  }

  private readNumberEnv(name: string, fallback: number) {
    const value = this.configService.get<string>(name)
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.floor(parsed)
  }

  private async tryCreateUniqueLock(key: string, payload: Prisma.JsonObject) {
    try {
      await this.prisma.systemSetting.create({
        data: {
          key,
          value: payload,
        },
      })
      return true
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
        return false
      }
      throw error
    }
  }

  private async dispatchNotification(payload: NotificationPayload): Promise<{ sent: boolean; reason?: string }> {
    const webhookUrl =
      payload.channel === "email"
        ? this.configService.get<string>("NOTIFICATIONS_EMAIL_WEBHOOK_URL")?.trim()
        : this.configService.get<string>("NOTIFICATIONS_WHATSAPP_WEBHOOK_URL")?.trim()

    if (!webhookUrl) {
      return { sent: false, reason: "provider_not_configured" }
    }

    const authHeader = this.configService.get<string>("NOTIFICATIONS_WEBHOOK_AUTH_HEADER")?.trim()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      if (!response.ok) {
        return { sent: false, reason: `provider_http_${response.status}` }
      }
      return { sent: true }
    } catch {
      return { sent: false, reason: "provider_unreachable" }
    } finally {
      clearTimeout(timeout)
    }
  }
}
