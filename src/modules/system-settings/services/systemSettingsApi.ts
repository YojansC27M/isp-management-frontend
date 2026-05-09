import api from "@/api/axios"
import type {
  CreateDocumentTypePayload,
  DocumentTypeItem,
  DocumentTypesPageMeta,
  DocumentTypesPageResponse,
  SystemSettings,
  SystemSettingsFormValues,
  UpdateDocumentTypePayload,
} from "../types/systemSettings"

export const getSystemSettings = async () => {
  const { data } = await api.get<SystemSettings>("/settings/system", { cancelKey: "system-settings" })
  return data
}

export const updateSystemSettings = async (payload: SystemSettingsFormValues) => {
  const { data } = await api.put<SystemSettings>("/settings/system", payload)
  return data
}

export const uploadSystemLogo = async (payload: { fileName: string; dataUrl: string }) => {
  const { data } = await api.post<{ logoUrl: string }>("/settings/system/logo", payload)
  return data
}

interface DocumentTypesFilters {
  includeInactive?: boolean
  search?: string
  status?: "all" | "active" | "inactive"
  page?: number
  perPage?: number
}

const DEFAULT_DOCUMENT_TYPES_META: DocumentTypesPageMeta = {
  page: 1,
  perPage: 25,
  total: 0,
  totalPages: 1,
}

const normalizeDocumentTypesMeta = (meta?: Partial<DocumentTypesPageMeta>): DocumentTypesPageMeta => {
  return {
    page: meta?.page && meta.page > 0 ? meta.page : DEFAULT_DOCUMENT_TYPES_META.page,
    perPage: meta?.perPage && meta.perPage > 0 ? meta.perPage : DEFAULT_DOCUMENT_TYPES_META.perPage,
    total: meta?.total && meta.total >= 0 ? meta.total : DEFAULT_DOCUMENT_TYPES_META.total,
    totalPages: meta?.totalPages && meta.totalPages > 0 ? meta.totalPages : DEFAULT_DOCUMENT_TYPES_META.totalPages,
  }
}

export const getDocumentTypesPage = async (filters: DocumentTypesFilters = {}) => {
  const { data } = await api.get<DocumentTypesPageResponse>("/settings/system/document-types", {
    params: {
      includeInactive: filters.includeInactive || undefined,
      search: filters.search?.trim() || undefined,
      status: filters.status || undefined,
      page: filters.page,
      perPage: filters.perPage,
    },
    cancelKey: `document-types:${filters.includeInactive ? "all" : "active"}:${filters.search ?? ""}:${filters.status ?? ""}:${filters.page ?? ""}:${filters.perPage ?? ""}`,
  })
  return {
    items: data.items ?? [],
    meta: normalizeDocumentTypesMeta(data.meta),
  }
}

export const getDocumentTypes = async (includeInactive = false) => {
  const perPage = 100
  let page = 1
  const items: DocumentTypeItem[] = []

  while (true) {
    const response = await getDocumentTypesPage({
      includeInactive,
      status: includeInactive ? "all" : "active",
      page,
      perPage,
    })
    items.push(...response.items)
    if (page >= response.meta.totalPages) break
    page += 1
  }

  return items
}

export const createDocumentType = async (payload: CreateDocumentTypePayload) => {
  const { data } = await api.post<DocumentTypeItem>("/settings/system/document-types", payload)
  return data
}

export const updateDocumentType = async (id: string, payload: UpdateDocumentTypePayload) => {
  const { data } = await api.put<DocumentTypeItem>(`/settings/system/document-types/${id}`, payload)
  return data
}

export const deactivateDocumentType = async (id: string) => {
  const { data } = await api.delete<DocumentTypeItem>(`/settings/system/document-types/${id}`)
  return data
}
