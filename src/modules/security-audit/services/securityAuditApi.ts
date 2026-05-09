import api from "@/api/axios"
import { isAxiosError } from "axios"
import type { SecurityAuditEntry } from "../types/securityAudit"

interface RawAuditRole {
  key?: string
  name?: string
}

interface RawAuditUser {
  id: string
  name?: string
  email?: string
  role?: RawAuditRole | null
}

interface RawAuditEntry {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  user?: RawAuditUser | null
}

interface SecurityAuditPageMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface SecurityAuditQuery {
  page?: number
  perPage?: number
  limit?: number
  actorId?: string
  action?: string
  module?: string
  dateFrom?: string
  dateTo?: string
}

export interface SecurityAuditPageResponse {
  items: SecurityAuditEntry[]
  meta: SecurityAuditPageMeta
}

const mapAuditEntry = (entry: RawAuditEntry): SecurityAuditEntry => {
  const user = entry.user
  return {
    id: entry.id,
    createdAt: entry.createdAt,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
    actor: user
      ? {
          id: user.id,
          name: user.name?.trim() || user.email?.trim() || "Usuario",
          email: user.email?.trim() || "",
          roleKey: user.role?.key,
          roleName: user.role?.name,
        }
      : null,
  }
}

export const getSecurityAuditEntries = async (query: SecurityAuditQuery = {}) => {
  const { data } = await api.get<RawAuditEntry[]>("/security/roles/permissions/audit", {
    params: {
      limit: query.limit ?? 200,
      actorId: query.actorId?.trim() || undefined,
      action: query.action?.trim() || undefined,
      module: query.module?.trim() || undefined,
      dateFrom: query.dateFrom || undefined,
      dateTo: query.dateTo || undefined,
    },
    cancelKey: `security-audit-list:${query.limit ?? 200}:${query.actorId ?? ""}:${query.action ?? ""}:${query.module ?? ""}:${query.dateFrom ?? ""}:${query.dateTo ?? ""}`,
  })

  return data.map(mapAuditEntry)
}

export const getSecurityAuditPage = async (query: SecurityAuditQuery = {}): Promise<SecurityAuditPageResponse> => {
  const page = query.page ?? 1
  const perPage = query.perPage ?? 25
  const params = {
    page,
    perPage,
    actorId: query.actorId?.trim() || undefined,
    action: query.action?.trim() || undefined,
    module: query.module?.trim() || undefined,
    dateFrom: query.dateFrom || undefined,
    dateTo: query.dateTo || undefined,
  }
  const cancelKey = `security-audit-page:${page}:${perPage}:${query.actorId ?? ""}:${query.action ?? ""}:${query.module ?? ""}:${query.dateFrom ?? ""}:${query.dateTo ?? ""}`

  try {
    const { data } = await api.get<{ items: RawAuditEntry[]; meta: SecurityAuditPageMeta }>("/security/roles/permissions/audit/page", {
      params,
      cancelKey,
    })

    return {
      items: data.items.map(mapAuditEntry),
      meta: data.meta,
    }
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) {
      throw error
    }

    const { data } = await api.get<RawAuditEntry[]>("/security/roles/permissions/audit", {
      params: {
        ...params,
        limit: Math.min(500, page * perPage),
      },
      cancelKey: `${cancelKey}:fallback`,
    })
    const mapped = data.map(mapAuditEntry)
    const total = mapped.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const start = (page - 1) * perPage
    const items = mapped.slice(start, start + perPage)

    return {
      items,
      meta: {
        page: Math.min(page, totalPages),
        perPage,
        total,
        totalPages,
      },
    }
  }
}

export const downloadSecurityAuditExport = async (query: SecurityAuditQuery = {}, format: "csv" | "json" | "xlsx" = "csv") => {
  const { data } = await api.get<Blob>("/security/roles/permissions/audit/export", {
    params: {
      limit: query.limit ?? 500,
      actorId: query.actorId?.trim() || undefined,
      action: query.action?.trim() || undefined,
      module: query.module?.trim() || undefined,
      dateFrom: query.dateFrom || undefined,
      dateTo: query.dateTo || undefined,
      format,
    },
    responseType: "blob",
  })
  return data
}
