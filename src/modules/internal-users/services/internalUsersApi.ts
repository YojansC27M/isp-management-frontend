import api from "@/api/axios"
import type { InternalUser, InternalUserFormValues } from "../types/internalUser"

interface InternalUsersFilters {
  search?: string
  role?: InternalUserFormValues["role"] | ""
  status?: InternalUserFormValues["status"] | ""
  page?: number
  perPage?: number
  sortBy?: "createdAt" | "name" | "email" | "role"
  sortDir?: "asc" | "desc"
  cursor?: string
  limit?: number
}

export interface InternalUsersPageMeta {
  mode?: "offset"
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface InternalUsersCursorMeta {
  mode?: "cursor"
  limit: number
  hasNext: boolean
  nextCursor: string | null
}

interface InternalUsersPageResponse {
  items: InternalUser[]
  meta: InternalUsersPageMeta
}

interface InternalUsersCursorResponse {
  items: InternalUser[]
  meta: InternalUsersCursorMeta
}

export const getInternalUsersPage = async (filters: InternalUsersFilters = {}) => {
  const { data } = await api.get<InternalUsersPageResponse>("/internal-users", {
    params: {
      search: filters.search?.trim() || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      page: filters.page,
      perPage: filters.perPage,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      cursor: filters.cursor,
      limit: filters.limit,
    },
    cancelKey: `list:${filters.search ?? ""}:${filters.role ?? ""}:${filters.status ?? ""}:${filters.page ?? ""}:${filters.perPage ?? ""}:${filters.sortBy ?? ""}:${filters.sortDir ?? ""}:${filters.cursor ?? ""}:${filters.limit ?? ""}`,
  })

  return data
}

export const getInternalUsers = async (filters: InternalUsersFilters = {}) => {
  const firstPage = await getInternalUsersPage({
    ...filters,
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 100,
  })

  let items = firstPage.items ?? []
  const totalPages = Math.max(1, firstPage.meta?.totalPages ?? 1)
  if (totalPages <= 1 || filters.page) {
    return items
  }

  for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
    const next = await getInternalUsersPage({
      ...filters,
      page: currentPage,
      perPage: filters.perPage ?? 100,
    })
    items = items.concat(next.items ?? [])
  }

  return items
}

export const getInternalUsersCursorPage = async (filters: InternalUsersFilters = {}) => {
  const { data } = await api.get<InternalUsersCursorResponse>("/internal-users", {
    params: {
      search: filters.search?.trim() || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      cursor: filters.cursor || undefined,
      limit: filters.limit,
    },
    cancelKey: `cursor-list:${filters.search ?? ""}:${filters.role ?? ""}:${filters.status ?? ""}:${filters.cursor ?? ""}:${filters.limit ?? ""}`,
  })
  return data
}

export const DEFAULT_INTERNAL_USERS_PAGE_META: InternalUsersPageMeta = {
  page: 1,
  perPage: 25,
  total: 0,
  totalPages: 1,
}

export const normalizeInternalUsersPageMeta = (meta?: Partial<InternalUsersPageMeta>): InternalUsersPageMeta => {
  return {
    page: meta?.page && meta.page > 0 ? meta.page : DEFAULT_INTERNAL_USERS_PAGE_META.page,
    perPage: meta?.perPage && meta.perPage > 0 ? meta.perPage : DEFAULT_INTERNAL_USERS_PAGE_META.perPage,
    total: meta?.total && meta.total >= 0 ? meta.total : DEFAULT_INTERNAL_USERS_PAGE_META.total,
    totalPages: meta?.totalPages && meta.totalPages > 0 ? meta.totalPages : DEFAULT_INTERNAL_USERS_PAGE_META.totalPages,
  }
}

export const DEFAULT_INTERNAL_USERS_CURSOR_META: InternalUsersCursorMeta = {
  limit: 25,
  hasNext: false,
  nextCursor: null,
}

export const normalizeInternalUsersCursorMeta = (meta?: Partial<InternalUsersCursorMeta>): InternalUsersCursorMeta => {
  return {
    limit: meta?.limit && meta.limit > 0 ? meta.limit : DEFAULT_INTERNAL_USERS_CURSOR_META.limit,
    hasNext: Boolean(meta?.hasNext),
    nextCursor: typeof meta?.nextCursor === "string" && meta.nextCursor.trim().length > 0 ? meta.nextCursor : null,
  }
}

export const clampInternalUsersPage = (page: number, meta: InternalUsersPageMeta) => {
  return Math.min(Math.max(1, page), Math.max(1, meta.totalPages))
}

export const getInternalUsersPageSafe = async (filters: InternalUsersFilters = {}) => {
  const data = await getInternalUsersPage(filters)
  return {
    items: data.items ?? [],
    meta: normalizeInternalUsersPageMeta(data.meta),
  }
}

export const getInternalUsersCursorPageSafe = async (filters: InternalUsersFilters = {}) => {
  const data = await getInternalUsersCursorPage(filters)
  return {
    items: data.items ?? [],
    meta: normalizeInternalUsersCursorMeta(data.meta),
  }
}

export type { InternalUsersFilters }

export const getInternalUserById = async (id: string) => {
  const { data } = await api.get<InternalUser>(`/internal-users/${id}`)
  return data
}

export const createInternalUser = async (payload: InternalUserFormValues) => {
  const { data } = await api.post<InternalUser>("/internal-users", payload)
  return data
}

export const updateInternalUser = async (id: string, payload: InternalUserFormValues) => {
  const { data } = await api.put<InternalUser>(`/internal-users/${id}`, payload)
  return data
}

export const deleteInternalUser = async (id: string) => {
  await api.delete<void>(`/internal-users/${id}`)
}
