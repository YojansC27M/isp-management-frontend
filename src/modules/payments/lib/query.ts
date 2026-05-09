import type { PaymentsListQuery } from "../types/payment"

const validSortBy = new Set(["paymentDate", "amount", "status", "invoiceNumber", "createdAt"])
const validSortDir = new Set(["asc", "desc"])
const validStatuses = new Set(["pending", "paid", "overdue", "refunded"])

export const normalizePaymentsQuery = (query: PaymentsListQuery) => {
  const search = query.search?.trim().slice(0, 120) ?? ""
  const status = validStatuses.has(query.status ?? "") ? query.status : ""
  const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? Math.trunc(query.page as number) : 1
  const perPageRaw = Number.isFinite(query.perPage) ? Math.trunc(query.perPage as number) : 25
  const perPage = Math.min(Math.max(1, perPageRaw), 100)
  const sortBy = validSortBy.has(query.sortBy ?? "") ? (query.sortBy as NonNullable<PaymentsListQuery["sortBy"]>) : "paymentDate"
  const sortDir = validSortDir.has(query.sortDir ?? "") ? (query.sortDir as NonNullable<PaymentsListQuery["sortDir"]>) : "desc"

  return {
    search,
    status,
    page,
    perPage,
    sortBy,
    sortDir,
  }
}

export const buildPaymentsParams = (query: PaymentsListQuery) => {
  const normalized = normalizePaymentsQuery(query)
  const params: Record<string, string> = {
    sortBy: normalized.sortBy,
    sortDir: normalized.sortDir,
    page: String(normalized.page),
    perPage: String(normalized.perPage),
  }

  if (normalized.search) params.search = normalized.search
  if (normalized.status) params.status = normalized.status
  return params
}
