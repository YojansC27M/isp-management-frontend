import type { PlansListQuery } from "../types/plan"

const validSortBy = new Set(["createdAt", "name", "price", "downloadSpeed", "uploadSpeed"])
const validSortDir = new Set(["asc", "desc"])
const validTypes = new Set(["residential", "business"])

export const normalizePlansQuery = (query: PlansListQuery) => {
  const search = query.search?.trim().slice(0, 120) ?? ""
  const type = validTypes.has(query.type ?? "") ? query.type : ""
  const sortBy = validSortBy.has(query.sortBy ?? "") ? (query.sortBy as NonNullable<PlansListQuery["sortBy"]>) : "createdAt"
  const sortDir = validSortDir.has(query.sortDir ?? "") ? (query.sortDir as NonNullable<PlansListQuery["sortDir"]>) : "desc"
  const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? Math.trunc(query.page as number) : 1
  const perPageRaw = Number.isFinite(query.perPage) ? Math.trunc(query.perPage as number) : 25
  const perPage = Math.min(Math.max(1, perPageRaw), 100)

  return {
    search,
    type,
    sortBy,
    sortDir,
    page,
    perPage,
  }
}

export const buildPlansParams = (query: PlansListQuery) => {
  const normalized = normalizePlansQuery(query)
  const params: Record<string, string> = {
    sortBy: normalized.sortBy,
    sortDir: normalized.sortDir,
    page: String(normalized.page),
    perPage: String(normalized.perPage),
  }

  if (normalized.search) params.search = normalized.search
  if (normalized.type) params.type = normalized.type

  return params
}
