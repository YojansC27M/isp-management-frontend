import { formatCurrency } from "@/lib/currency"
import type { Invoice, InvoiceStatus } from "../types/invoice"

const normalizeDateInput = (value: string) => value.trim()

const parseInvoiceDate = (value: string) => {
  const normalized = normalizeDateInput(value)
  if (!normalized) return null

  const directDate = new Date(normalized)
  if (!Number.isNaN(directDate.getTime())) return directDate

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const utcDate = new Date(`${normalized}T00:00:00Z`)
    if (!Number.isNaN(utcDate.getTime())) return utcDate
  }

  return null
}

const formatSafeDate = (value: string, locale: string) => {
  const parsed = parseInvoiceDate(value)
  if (!parsed) return "—"

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

export const invoiceStatusTone: Record<InvoiceStatus, string> = {
  pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  paid: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  overdue: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  cancelled: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
}

export const formatInvoiceDate = (value: string, locale = "es-CO") => formatSafeDate(value, locale)

export const formatInvoiceAmount = (value: number, currency = "COP", locale = "es-CO") =>
  formatCurrency(value, currency, locale)

export const isInvoiceDueSoon = (invoice: Invoice, referenceDate = new Date()) => {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false
  const dueDate = parseInvoiceDate(invoice.dueDate)
  if (!dueDate) return false
  const startOfToday = new Date(referenceDate)
  startOfToday.setUTCHours(0, 0, 0, 0)
  const diffMs = dueDate.getTime() - startOfToday.getTime()
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000
}

export const getInvoiceFinancialSummary = (invoices: Invoice[]) => {
  return invoices.reduce(
    (acc, invoice) => {
      acc.totalCount += 1
      acc.totalAmount += invoice.amount

      if (invoice.status === "paid") {
        acc.paidCount += 1
        acc.paidAmount += invoice.amount
      }

      if (invoice.status === "pending") {
        acc.pendingCount += 1
        acc.pendingAmount += invoice.amount
      }

      if (invoice.status === "overdue") {
        acc.overdueCount += 1
        acc.overdueAmount += invoice.amount
      }

      if (isInvoiceDueSoon(invoice)) {
        acc.dueSoonCount += 1
      }

      return acc
    },
    {
      totalCount: 0,
      totalAmount: 0,
      paidCount: 0,
      paidAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      dueSoonCount: 0,
    },
  )
}
