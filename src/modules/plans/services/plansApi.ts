import api from "@/api/axios"
import { buildPlansParams } from "../lib/query"
import type { Plan, PlanFormValues, PlansListQuery, PlansPageMeta, PlansPageResponse } from "../types/plan"

interface PlansRequestOptions {
  cancel?: boolean
  query?: PlansListQuery
}

export const getPlans = async (options?: PlansRequestOptions) => {
  const config = {
    ...(options?.cancel === false ? {} : { cancelKey: "list" }),
    ...(options?.query ? { params: buildPlansParams(options.query) } : {}),
  }
  const { data } = await api.get<Plan[]>("/plans", config)
  return data
}

const DEFAULT_PLANS_META: PlansPageMeta = {
  page: 1,
  perPage: 25,
  total: 0,
  totalPages: 1,
}

const normalizePlansMeta = (meta?: Partial<PlansPageMeta>): PlansPageMeta => {
  return {
    page: meta?.page && meta.page > 0 ? meta.page : DEFAULT_PLANS_META.page,
    perPage: meta?.perPage && meta.perPage > 0 ? meta.perPage : DEFAULT_PLANS_META.perPage,
    total: meta?.total && meta.total >= 0 ? meta.total : DEFAULT_PLANS_META.total,
    totalPages: meta?.totalPages && meta.totalPages > 0 ? meta.totalPages : DEFAULT_PLANS_META.totalPages,
  }
}

export const getPlansPage = async (query: PlansListQuery = {}) => {
  const params = buildPlansParams(query)
  const { data } = await api.get<PlansPageResponse>("/plans/page", {
    params,
    cancelKey: `plans:page:${params.page}:${params.perPage}:${params.search ?? ""}:${params.type ?? ""}:${params.sortBy}:${params.sortDir}`,
  })
  return {
    items: data.items ?? [],
    meta: normalizePlansMeta(data.meta),
  }
}

export const getPlanById = async (id: string) => {
  const { data } = await api.get<Plan>(`/plans/${id}`)
  return data
}

export const createPlan = async (payload: PlanFormValues) => {
  const { data } = await api.post<Plan>("/plans", payload)
  return data
}

export const updatePlan = async (id: string, payload: PlanFormValues) => {
  const { data } = await api.put<Plan>(`/plans/${id}`, payload)
  return data
}

export const deletePlan = async (id: string) => {
  const { data } = await api.delete<void>(`/plans/${id}`)
  return data
}
