import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import { InvoiceStatus, Prisma } from "@prisma/client"
import ExcelJS from "exceljs"
import PDFDocument from "pdfkit"
import { readFile } from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import { PrismaService } from "@/common/prisma/prisma.service"

interface ReportingFilters {
  dateFrom?: string
  dateTo?: string
  zone?: string
  plan?: string
}

interface ClientFilter {
  address?: { contains: string; mode: "insensitive" }
  plan?: { is: { name: { contains: string; mode: "insensitive" } } }
}

interface ReportBranding {
  companyName: string
  tradeName: string
  logoUrl: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  legalFooter: string
}

const hexColorPattern = /^#([0-9A-Fa-f]{6})$/
interface ExportContext {
  requestId?: string | null
}

const toNumber = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0)

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name)

  constructor(private readonly prisma: PrismaService) {}

  private validateDateRange(filters: ReportingFilters) {
    this.validateTextFilters(filters)
    if (!filters.dateFrom || !filters.dateTo) return

    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`).getTime()
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`).getTime()

    if (Number.isNaN(from) || Number.isNaN(to)) {
      throw new BadRequestException("Invalid date range")
    }

    if (from > to) {
      throw new BadRequestException("dateFrom cannot be greater than dateTo")
    }

    const maxWindowDays = 366
    const days = Math.floor((to - from) / 86_400_000)
    if (days > maxWindowDays) {
      throw new BadRequestException(`The selected period cannot exceed ${maxWindowDays} days`)
    }
  }

  private validateTextFilters(filters: ReportingFilters) {
    const maxLength = 120
    const candidates = [filters.zone, filters.plan]
    const hasInvalidLength = candidates.some((value) => value && value.trim().length > maxLength)

    if (hasInvalidLength) {
      throw new BadRequestException(`Text filters cannot exceed ${maxLength} characters`)
    }
  }

  async getMetrics(filters: ReportingFilters) {
    this.validateDateRange(filters)
    const invoices = await this.findInvoices(filters)
    const totalRevenue = invoices.reduce((sum, invoice) => sum + toNumber(invoice.total), 0)
    const totalPending = invoices
      .filter((invoice) => invoice.status === InvoiceStatus.pending)
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0)
    const totalOverdue = invoices
      .filter((invoice) => invoice.status === InvoiceStatus.overdue)
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0)
    const totalPaid = invoices
      .filter((invoice) => invoice.status === InvoiceStatus.paid)
      .reduce((sum, invoice) => sum + toNumber(invoice.total), 0)

    return {
      totalRevenue,
      totalPending,
      totalOverdue,
      totalPaid,
    }
  }

  async getRevenue(filters: ReportingFilters) {
    this.validateDateRange(filters)
    const invoices = await this.findInvoices(filters)
    const grouped = new Map<string, number>()

    for (const invoice of invoices) {
      const day = invoice.issuedAt.toISOString().slice(0, 10)
      grouped.set(day, (grouped.get(day) ?? 0) + toNumber(invoice.total))
    }

    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  async getStatus(filters: ReportingFilters) {
    this.validateDateRange(filters)
    const invoices = await this.findInvoices(filters)
    const counts = {
      pending: 0,
      paid: 0,
      overdue: 0,
    }

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.pending) counts.pending += 1
      if (invoice.status === InvoiceStatus.paid) counts.paid += 1
      if (invoice.status === InvoiceStatus.overdue) counts.overdue += 1
    }

    return [
      { status: "pending" as const, count: counts.pending },
      { status: "paid" as const, count: counts.paid },
      { status: "overdue" as const, count: counts.overdue },
    ]
  }

  async getOverdue(filters: ReportingFilters) {
    this.validateDateRange(filters)
    const invoices = await this.findInvoices(filters)
    const overdueInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.overdue)

    const grouped = new Map<string, { id: string; name: string; amountDue: number; daysOverdue: number }>()
    const now = Date.now()

    for (const invoice of overdueInvoices) {
      const existing = grouped.get(invoice.clientId)
      const amount = toNumber(invoice.total)
      const daysOverdue = Math.max(0, Math.floor((now - invoice.dueAt.getTime()) / 86_400_000))

      if (existing) {
        existing.amountDue += amount
        existing.daysOverdue = Math.max(existing.daysOverdue, daysOverdue)
      } else {
        grouped.set(invoice.clientId, {
          id: invoice.clientId,
          name: invoice.client.name,
          amountDue: amount,
          daysOverdue,
        })
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.amountDue - a.amountDue)
  }

  async getOperations(filters: ReportingFilters) {
    this.validateDateRange(filters)
    const createdAtRange = this.buildDateRange(filters)
    const client = this.buildClientWhere(filters)

    const [ticketsByStatus, visitsByStatus, installationsByStatus] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ["status"],
        where: {
          createdAt: createdAtRange,
          client,
        },
        _count: {
          status: true,
        },
      }),
      this.prisma.visit.groupBy({
        by: ["status"],
        where: {
          scheduledAt: createdAtRange,
          client,
        },
        _count: {
          status: true,
        },
      }),
      this.prisma.installation.groupBy({
        by: ["status"],
        where: {
          createdAt: createdAtRange,
          client,
        },
        _count: {
          status: true,
        },
      }),
    ])

    const ticketCounts = new Map(ticketsByStatus.map((item) => [item.status, item._count.status]))
    const visitCounts = new Map(visitsByStatus.map((item) => [item.status, item._count.status]))
    const installationCounts = new Map(installationsByStatus.map((item) => [item.status, item._count.status]))

    return {
      openTickets: (ticketCounts.get("open") ?? 0) + (ticketCounts.get("waiting") ?? 0),
      inProgressTickets: ticketCounts.get("in_progress") ?? 0,
      resolvedTickets: (ticketCounts.get("resolved") ?? 0) + (ticketCounts.get("closed") ?? 0),
      scheduledVisits: visitCounts.get("scheduled") ?? 0,
      completedVisits: (visitCounts.get("completed") ?? 0) + (visitCounts.get("done") ?? 0),
      pendingInstallations: (installationCounts.get("pending") ?? 0) + (installationCounts.get("scheduled") ?? 0),
      completedInstallations: installationCounts.get("installed") ?? 0,
    }
  }

  async exportReport(
    filters: ReportingFilters & { format: "csv" | "json" | "xlsx" | "pdf" },
    actorId?: string,
    context: ExportContext = {},
  ) {
    this.validateDateRange(filters)
    const requestId = context.requestId ?? null
    const trace = (stage: string, extra: Record<string, unknown> = {}) =>
      this.logger.log(
        JSON.stringify({
          domain: "reports.export",
          stage,
          requestId,
          actorId: actorId ?? null,
          format: filters.format,
          ...extra,
        }),
      )

    try {
      trace("start", {
        hasDateFrom: Boolean(filters.dateFrom),
        hasDateTo: Boolean(filters.dateTo),
        hasZone: Boolean(filters.zone),
        hasPlan: Boolean(filters.plan),
      })

      const [metrics, revenue, status, overdue, operations] = await Promise.all([
        this.getMetrics(filters),
        this.getRevenue(filters),
        this.getStatus(filters),
        this.getOverdue(filters),
        this.getOperations(filters),
      ])
      trace("data_loaded", {
        revenueRows: revenue.length,
        statusRows: status.length,
        overdueRows: overdue.length,
      })

      const exportedAt = new Date().toISOString()
      const payload = {
        filters: {
          dateFrom: filters.dateFrom ?? null,
          dateTo: filters.dateTo ?? null,
          zone: filters.zone ?? null,
          plan: filters.plan ?? null,
        },
        exportedAt,
        metrics,
        operations,
        revenue,
        status,
        overdue,
      }

      const branding = await this.getReportBranding()
      trace("branding_loaded", {
        hasLogoUrl: Boolean(branding.logoUrl),
        primaryColor: branding.brandPrimaryColor,
        secondaryColor: branding.brandSecondaryColor,
      })

      await this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "reports.export",
          entity: "report",
          metadata: {
            format: filters.format,
            exportedAt,
            requestId,
            filters: payload.filters,
            totals: {
              revenueRows: revenue.length,
              statusRows: status.length,
              overdueRows: overdue.length,
              operationKeys: Object.keys(operations).length,
            },
          },
        },
      })

      if (filters.format === "json") {
        const result = {
          contentType: "application/json; charset=utf-8",
          fileName: `reports-${exportedAt.slice(0, 10)}.json`,
          buffer: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
        }
        trace("file_rendered", { contentType: result.contentType, fileName: result.fileName })
        return result
      }

      if (filters.format === "xlsx") {
        const result = {
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileName: `reports-${exportedAt.slice(0, 10)}.xlsx`,
          buffer: await this.buildExcelBuffer(payload),
        }
        trace("file_rendered", { contentType: result.contentType, fileName: result.fileName, size: result.buffer.length })
        return result
      }

      if (filters.format === "pdf") {
        const result = {
          contentType: "application/pdf",
          fileName: `reports-${exportedAt.slice(0, 10)}.pdf`,
          buffer: await this.buildPdfBuffer({ ...payload, actorId: actorId ?? null, branding }),
        }
        trace("file_rendered", { contentType: result.contentType, fileName: result.fileName, size: result.buffer.length })
        return result
      }

      const csvLines = [
        "section,key,value",
        `metrics,totalRevenue,${metrics.totalRevenue}`,
        `metrics,totalPaid,${metrics.totalPaid}`,
        `metrics,totalPending,${metrics.totalPending}`,
        `metrics,totalOverdue,${metrics.totalOverdue}`,
        ...Object.entries(operations).map(([key, value]) => `operations,${key},${value}`),
        ...revenue.map((row) => `revenue,${this.escapeCsvValue(row.date)},${this.escapeCsvValue(String(row.amount))}`),
        ...status.map((row) => `status,${this.escapeCsvValue(row.status)},${this.escapeCsvValue(String(row.count))}`),
        ...overdue.map((row) => `overdue,${this.escapeCsvValue(row.name)},${this.escapeCsvValue(String(row.amountDue))}`),
      ]

      const result = {
        contentType: "text/csv; charset=utf-8",
        fileName: `reports-${exportedAt.slice(0, 10)}.csv`,
        buffer: Buffer.from(csvLines.join("\n"), "utf-8"),
      }
      trace("file_rendered", { contentType: result.contentType, fileName: result.fileName, size: result.buffer.length })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error"
      this.logger.error(
        JSON.stringify({
          domain: "reports.export",
          stage: "error",
          requestId,
          actorId: actorId ?? null,
          format: filters.format,
          error: message,
        }),
        error instanceof Error ? error.stack : undefined,
      )
      throw error
    }
  }

  private findInvoices(filters: ReportingFilters) {
    const dateRange = this.buildDateRange(filters)
    const client = this.buildClientWhere(filters)

    return this.prisma.invoice.findMany({
      where: {
        status: {
          not: InvoiceStatus.cancelled,
        },
        issuedAt: dateRange,
        client,
      },
      include: {
        client: true,
      },
      orderBy: {
        issuedAt: "asc",
      },
    })
  }

  private buildDateRange(filters: ReportingFilters) {
    const dateFrom = filters.dateFrom?.trim()
    const dateTo = filters.dateTo?.trim()

    return {
      gte: dateFrom ? new Date(`${dateFrom}T00:00:00.000Z`) : undefined,
      lte: dateTo ? new Date(`${dateTo}T23:59:59.999Z`) : undefined,
    }
  }

  private buildClientWhere(filters: ReportingFilters): ClientFilter | undefined {
    const plan = filters.plan?.trim()
    const zone = filters.zone?.trim()

    if (!plan && !zone) return undefined

    return {
      plan: plan ? { is: { name: { contains: plan, mode: "insensitive" } } } : undefined,
      address: zone ? { contains: zone, mode: "insensitive" } : undefined,
    }
  }

  private escapeCsvValue(value: string) {
    const normalized = value.replace(/\r?\n|\r/g, " ").trim()
    const dangerPrefix = /^[=+\-@]/
    const escaped = dangerPrefix.test(normalized) ? `'${normalized}` : normalized
    return `"${escaped.replaceAll('"', '""')}"`
  }

  private async buildExcelBuffer(payload: {
    metrics: { totalRevenue: number; totalPaid: number; totalPending: number; totalOverdue: number }
    operations: Record<string, number>
    revenue: Array<{ date: string; amount: number }>
    status: Array<{ status: string; count: number }>
    overdue: Array<{ name: string; amountDue: number; daysOverdue: number }>
  }) {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "ISP Management"
    workbook.created = new Date()

    const summarySheet = workbook.addWorksheet("Resumen")
    summarySheet.columns = [
      { header: "Seccion", key: "section", width: 28 },
      { header: "Indicador", key: "key", width: 32 },
      { header: "Valor", key: "value", width: 22 },
    ]
    summarySheet.addRows([
      { section: "Metricas", key: "totalRevenue", value: payload.metrics.totalRevenue },
      { section: "Metricas", key: "totalPaid", value: payload.metrics.totalPaid },
      { section: "Metricas", key: "totalPending", value: payload.metrics.totalPending },
      { section: "Metricas", key: "totalOverdue", value: payload.metrics.totalOverdue },
      ...Object.entries(payload.operations).map(([key, value]) => ({ section: "Operaciones", key, value })),
    ])

    const revenueSheet = workbook.addWorksheet("Ingresos")
    revenueSheet.columns = [
      { header: "Fecha", key: "date", width: 18 },
      { header: "Monto", key: "amount", width: 18 },
    ]
    revenueSheet.addRows(payload.revenue)

    const statusSheet = workbook.addWorksheet("Estados")
    statusSheet.columns = [
      { header: "Estado", key: "status", width: 18 },
      { header: "Cantidad", key: "count", width: 18 },
    ]
    statusSheet.addRows(payload.status)

    const overdueSheet = workbook.addWorksheet("Mora")
    overdueSheet.columns = [
      { header: "Cliente", key: "name", width: 30 },
      { header: "Monto vencido", key: "amountDue", width: 18 },
      { header: "Dias en mora", key: "daysOverdue", width: 18 },
    ]
    overdueSheet.addRows(payload.overdue)

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  private buildPdfBuffer(payload: {
    actorId: string | null
    branding: ReportBranding
    exportedAt: string
    filters: { dateFrom: string | null; dateTo: string | null; zone: string | null; plan: string | null }
    metrics: { totalRevenue: number; totalPaid: number; totalPending: number; totalOverdue: number }
    operations: Record<string, number>
    overdue: Array<{ name: string; amountDue: number; daysOverdue: number }>
  }) {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: "A4" })
      const chunks: Buffer[] = []
      let pageNumber = 1
      const pageWidth = doc.page.width
      const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right

      doc.on("data", (chunk: Buffer) => chunks.push(chunk))
      doc.on("end", () => resolve(Buffer.concat(chunks)))
      doc.on("error", reject)

      const ensureSpace = (requiredHeight: number) => {
        if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom - 24) {
          startNewPage()
        }
      }

      const startNewPage = () => {
        doc.addPage()
        pageNumber += 1
        drawHeader()
        drawFooter()
        doc.y = 120
      }

      const drawHeader = () => {
        doc.save()
        const headerSubtitle = this.truncateForSingleLine(
          `Rango: ${payload.filters.dateFrom ?? "..."} a ${payload.filters.dateTo ?? "..."} | Zona: ${payload.filters.zone ?? "Todas"} | Plan: ${payload.filters.plan ?? "Todos"}`,
          120,
        )
        doc.rect(doc.page.margins.left, 30, contentWidth, 54).fill(payload.branding.brandPrimaryColor)
        doc.fillColor("#ffffff").fontSize(15).text("ISP Management - Reporte Ejecutivo", doc.page.margins.left + 12, 44)
        doc.fontSize(9).text(`Generado: ${new Date(payload.exportedAt).toLocaleString("es-CO")}`, doc.page.margins.left + 12, 62)
        doc
          .fontSize(9)
          .text(headerSubtitle, doc.page.margins.left + 220, 62, {
            width: contentWidth - 230,
            align: "right",
            lineBreak: false,
            ellipsis: true,
          })
        doc.restore()
      }

      const drawFooter = () => {
        doc.save()
        doc.rect(doc.page.margins.left, doc.page.height - 34, contentWidth, 1).fill(payload.branding.brandSecondaryColor)
        doc
          .fontSize(9)
          .fillColor("#475569")
          .text(`Pagina ${pageNumber}`, doc.page.margins.left, doc.page.height - 28, { align: "center", width: contentWidth })
        doc.restore()
      }

      const drawSectionTitle = (title: string) => {
        ensureSpace(26)
        doc.moveDown(0.3)
        doc.fontSize(12).fillColor("#0f172a").text(title)
        doc.moveDown(0.2)
      }

      const drawKeyValueTable = (rows: Array<{ key: string; value: string }>) => {
        const col1X = doc.page.margins.left
        const col2X = doc.page.margins.left + 280
        const rowHeight = 22
        ensureSpace(rowHeight + 20)
        doc.rect(col1X, doc.y, contentWidth, rowHeight).fill(payload.branding.brandSecondaryColor)
        doc.fillColor("#0f172a").fontSize(10).text("Indicador", col1X + 8, doc.y + 7)
        doc.fillColor("#0f172a").fontSize(10).text("Valor", col2X + 8, doc.y + 7)
        doc.y += rowHeight
        rows.forEach((row, index) => {
          ensureSpace(rowHeight + 4)
          if (index % 2 === 0) {
            doc.rect(col1X, doc.y, contentWidth, rowHeight).fill("#f8fafc")
          }
          doc.fillColor("#1e293b").fontSize(10).text(row.key, col1X + 8, doc.y + 7, { width: 260 })
          doc.fillColor("#1e293b").fontSize(10).text(row.value, col2X + 8, doc.y + 7, { width: 200, align: "right" })
          doc.y += rowHeight
        })
      }

      const render = async () => {
        drawHeader()
        drawFooter()
        doc.y = 120

        const logoBuffer = await this.resolveLogoBuffer(payload.branding.logoUrl)
        if (logoBuffer && this.isPdfKitSupportedImageBuffer(logoBuffer)) {
          try {
            doc.image(logoBuffer, doc.page.margins.left, 88, { fit: [100, 28], valign: "center" })
          } catch {
            doc
              .fillColor(payload.branding.brandPrimaryColor)
              .fontSize(10)
              .text(payload.branding.tradeName || payload.branding.companyName, doc.page.margins.left, 94)
          }
        } else {
          doc.fillColor(payload.branding.brandPrimaryColor).fontSize(10).text(payload.branding.tradeName || payload.branding.companyName, doc.page.margins.left, 94)
        }

        drawSectionTitle("Metricas Financieras")
        drawKeyValueTable([
          { key: "Ingresos totales", value: payload.metrics.totalRevenue.toFixed(2) },
          { key: "Total pagado", value: payload.metrics.totalPaid.toFixed(2) },
          { key: "Total pendiente", value: payload.metrics.totalPending.toFixed(2) },
          { key: "Total vencido", value: payload.metrics.totalOverdue.toFixed(2) },
        ])

        drawSectionTitle("Metricas Operativas")
        drawKeyValueTable(
          Object.entries(payload.operations).map(([key, value]) => ({
            key,
            value: String(value),
          })),
        )

        drawSectionTitle("Top Clientes en Mora")
        drawKeyValueTable(
          payload.overdue.slice(0, 15).map((item) => ({
            key: `${item.name} (${item.daysOverdue} dias)`,
            value: item.amountDue.toFixed(2),
          })),
        )

        ensureSpace(70)
        doc.moveDown(1)
        doc
          .fontSize(10)
          .fillColor("#334155")
          .text(`Firmado digitalmente por ${payload.branding.tradeName || payload.branding.companyName}`, { align: "left" })
        doc
          .fontSize(9)
          .fillColor("#64748b")
          .text(`Responsable: ${payload.actorId ?? "sistema"} | Fecha: ${new Date(payload.exportedAt).toISOString()}`)
        doc.fontSize(9).fillColor("#64748b").text(payload.branding.legalFooter)

        if (payload.overdue.length === 0) {
          drawSectionTitle("Observaciones")
          doc.fontSize(10).fillColor("#334155").text("No se encontraron clientes en mora para el rango seleccionado.")
        }

        doc.end()
      }

      void render().catch((error) => reject(error))
    })
  }

  private async getReportBranding(): Promise<ReportBranding> {
    const defaults: ReportBranding = {
      companyName: "Corma Networks S.A.S.",
      tradeName: "Corma ISP",
      logoUrl: "",
      brandPrimaryColor: "#0f172a",
      brandSecondaryColor: "#e2e8f0",
      legalFooter: "Este documento es informativo y fue generado automaticamente desde la plataforma.",
    }
    const row = await this.prisma.systemSetting?.findUnique({ where: { key: "system" } })
    if (!row || !row.value || typeof row.value !== "object") return defaults
    const merged = { ...defaults, ...(row.value as object) } as Partial<ReportBranding>

    return {
      companyName: this.asNonEmptyString(merged.companyName, defaults.companyName),
      tradeName: this.asNonEmptyString(merged.tradeName, defaults.tradeName),
      logoUrl: this.asNonEmptyString(merged.logoUrl, defaults.logoUrl),
      brandPrimaryColor: this.asHexColor(merged.brandPrimaryColor, defaults.brandPrimaryColor),
      brandSecondaryColor: this.asHexColor(merged.brandSecondaryColor, defaults.brandSecondaryColor),
      legalFooter: this.asNonEmptyString(merged.legalFooter, defaults.legalFooter),
    }
  }

  private async resolveLogoBuffer(logoUrl: string): Promise<Buffer | null> {
    const normalized = logoUrl.trim()
    if (!normalized) return null

    if (normalized.startsWith("data:image/")) {
      const parts = normalized.split(",", 2)
      if (parts.length !== 2) return null
      const base64 = parts[1]
      if (!base64) return null
      return Buffer.from(base64, "base64")
    }

    const localPath = normalized.startsWith("/uploads/")
      ? join(process.cwd(), normalized.replace(/^\//, ""))
      : normalized.startsWith("uploads/")
        ? join(process.cwd(), normalized)
        : isAbsolute(normalized)
          ? normalized
          : null

    if (!localPath) return null

    try {
      return await readFile(localPath)
    } catch {
      return null
    }
  }

  private asNonEmptyString(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }

  private asHexColor(value: unknown, fallback: string) {
    if (typeof value !== "string") return fallback
    return hexColorPattern.test(value.trim()) ? value.trim() : fallback
  }

  private isPdfKitSupportedImageBuffer(buffer: Buffer) {
    if (buffer.length < 4) return false
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    return isJpeg || isPng
  }

  private truncateForSingleLine(value: string, maxChars: number) {
    const normalized = value.replace(/\s+/g, " ").trim()
    if (normalized.length <= maxChars) return normalized
    return `${normalized.slice(0, Math.max(0, maxChars - 1))}\u2026`
  }
}
