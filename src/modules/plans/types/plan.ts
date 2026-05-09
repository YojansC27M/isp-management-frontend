export type PlanType = "residential" | "business"
export type PlanSortBy = "createdAt" | "name" | "price" | "downloadSpeed" | "uploadSpeed"
export type PlanSortDir = "asc" | "desc"

export interface Plan {
  id: string
  name: string
  downloadSpeed: number
  uploadSpeed: number
  price: number
  type: PlanType
}

export interface PlanFormValues {
  name: string
  downloadSpeed: number
  uploadSpeed: number
  price: number
  type: PlanType
}

export interface PlansListQuery {
  search?: string
  type?: PlanType | ""
  sortBy?: PlanSortBy
  sortDir?: PlanSortDir
  page?: number
  perPage?: number
}

export interface PlansPageMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface PlansPageResponse {
  items: Plan[]
  meta: PlansPageMeta
}
