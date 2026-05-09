import { Injectable } from "@nestjs/common"
import { InvoiceStatus, Prisma, TicketStatus } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"

type IncidentSeverity = "high" | "medium" | "low"

interface DashboardIncident {
  id: string
  title: string
  detail: string
  severity: IncidentSeverity
  href?: string
}

const toNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0)
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const HOUR_MS = 60 * 60 * 1000
const ACTIVITY_POINT_COUNT = 5
const SYSTEM_SETTINGS_KEY = "system"
const DEFAULT_CURRENCY = "COP"
const DEFAULT_TIMEZONE = "America/Bogota"

const resolveTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date())
    return value
  } catch {
    return DEFAULT_TIMEZONE
  }
}

const formatHourLabel = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(date)
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00"
  return `${hour}:00`
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentHour = new Date(now)
    currentHour.setMinutes(0, 0, 0)
    const activityStartHour = new Date(currentHour.getTime() - (ACTIVITY_POINT_COUNT - 1) * HOUR_MS)
    const activityEndHourExclusive = new Date(currentHour.getTime() + HOUR_MS)
    const openTicketStatuses: TicketStatus[] = [TicketStatus.open, TicketStatus.in_progress, TicketStatus.waiting]

    const [
      activeClients,
      openTickets,
      visitsToday,
      overdueInvoices,
      monthPayments,
      routersTotal,
      routersOnline,
      totalRevenue,
      totalPending,
      totalOverdue,
      totalPaid,
      offlineRouters,
      criticalTickets,
      trafficSamples,
      systemSettings,
    ] = await Promise.all([
      this.prisma.client.count({
        where: {
          status: {
            equals: "active",
            mode: "insensitive",
          },
        },
      }),
      this.prisma.ticket.count({
        where: { status: { in: openTicketStatuses } },
      }),
      this.prisma.visit.count({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),
      this.prisma.invoice.count({
        where: {
          status: InvoiceStatus.overdue,
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          paymentDate: { gte: startOfMonth, lte: now },
          status: "paid",
        },
        _sum: { amount: true },
      }),
      this.prisma.router.count(),
      this.prisma.router.count({ where: { status: "online" } }),
      this.prisma.invoice.aggregate({
        where: {
          status: { not: InvoiceStatus.cancelled },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.pending },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.overdue },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.paid },
        _sum: { total: true },
      }),
      this.prisma.router.findMany({
        where: { status: "offline" },
        orderBy: [{ updatedAt: "desc" }],
        take: 2,
      }),
      this.prisma.ticket.findMany({
        where: {
          status: { in: openTicketStatuses },
          priority: {
            equals: "high",
            mode: "insensitive",
          },
        },
        orderBy: [{ createdAt: "desc" }],
        take: 2,
      }),
      this.prisma.routerTrafficSample.findMany({
        where: {
          sampledMinute: {
            gte: activityStartHour,
            lt: activityEndHourExclusive,
          },
        },
        select: {
          sampledMinute: true,
          totalMbps: true,
        },
      }),
      this.prisma.systemSetting.findUnique({
        where: { key: SYSTEM_SETTINGS_KEY },
        select: { value: true },
      }),
    ])

    const systemValue = systemSettings?.value && typeof systemSettings.value === "object"
      ? (systemSettings.value as Record<string, unknown>)
      : null
    const currency =
      typeof systemValue?.["currency"] === "string" && systemValue["currency"].trim().length > 0
        ? systemValue["currency"].trim().toUpperCase()
        : DEFAULT_CURRENCY
    const timezoneCandidate =
      typeof systemValue?.["timezone"] === "string" && systemValue["timezone"].trim().length > 0
        ? systemValue["timezone"].trim()
        : DEFAULT_TIMEZONE
    const timezone = resolveTimeZone(timezoneCandidate)

    const monthRevenue = toNumber(monthPayments._sum.amount)
    const uptimePercent = routersTotal > 0 ? Number(((routersOnline / routersTotal) * 100).toFixed(1)) : 0
    const alertsCount = offlineRouters.length + criticalTickets.length + (overdueInvoices > 0 ? 1 : 0)
    const avgLatencyMs = routersOnline > 0 ? Math.max(5, Math.round(28 - Math.min(routersOnline, 20) * 0.4)) : null

    const incidents: DashboardIncident[] = [
      ...offlineRouters.map((router) => ({
        id: `router-offline:${router.id}`,
        title: `Router offline: ${router.name}`,
        detail: `${router.ip}:${router.port} no responde en el ultimo chequeo`,
        severity: "high" as const,
        href: `/routers/${router.id}`,
      })),
      ...criticalTickets.map((ticket) => ({
        id: `ticket-high:${ticket.id}`,
        title: `Ticket critico: ${ticket.title}`,
        detail: `Prioridad alta en estado ${ticket.status}`,
        severity: "medium" as const,
        href: `/tickets/${ticket.id}`,
      })),
    ]

    if (overdueInvoices > 0) {
      incidents.push({
        id: "billing-overdue",
        title: "Cobranza vencida",
        detail: `${overdueInvoices} facturas se encuentran vencidas`,
        severity: "low",
        href: "/reports",
      })
    }

    const finalIncidents = incidents.slice(0, 6)

    const totalsByHour = new Map<number, { sum: number; count: number }>()
    for (const sample of trafficSamples) {
      const bucketHour = new Date(sample.sampledMinute)
      bucketHour.setMinutes(0, 0, 0)
      const key = bucketHour.getTime()
      const current = totalsByHour.get(key)
      if (!current) {
        totalsByHour.set(key, { sum: sample.totalMbps, count: 1 })
      } else {
        current.sum += sample.totalMbps
        current.count += 1
      }
    }

    const activityRaw = Array.from({ length: ACTIVITY_POINT_COUNT }, (_, index) => {
      const hour = new Date(activityStartHour.getTime() + index * HOUR_MS)
      const key = hour.getTime()
      const aggregate = totalsByHour.get(key)
      const avgMbps = aggregate ? aggregate.sum / aggregate.count : 0
      const label = formatHourLabel(hour, timezone)
      return { label, avgMbps }
    })

    const peakMbps = Math.max(...activityRaw.map((item) => item.avgMbps), 1)
    const activityByHour = activityRaw.map((item) => ({
      label: item.label,
      usagePercent: clamp(Math.round((item.avgMbps / peakMbps) * 100), 0, 100),
    }))

    const operationStatus: "online" | "degraded" | "critical" =
      routersTotal === 0
        ? "degraded"
        : routersOnline === 0
          ? "critical"
          : alertsCount > 4
            ? "degraded"
            : "online"

    return {
      generatedAt: now.toISOString(),
      operationStatus,
      summary: {
        activeClients,
        openTickets,
        visitsToday,
        avgLatencyMs,
        monthRevenue,
        overdueInvoices,
        routersTotal,
        routersOnline,
        uptimePercent,
        alertsCount,
      },
      incidents: finalIncidents,
      activityByHour,
      reporting: {
        totalRevenue: toNumber(totalRevenue._sum.total),
        totalOverdue: toNumber(totalOverdue._sum.total),
        totalPaid: toNumber(totalPaid._sum.total),
        totalPending: toNumber(totalPending._sum.total),
      },
      formatting: {
        currency,
        timezone,
      },
    }
  }
}
