import api from "@/api/axios"
import type { ManagedRouter, RouterConnectionResult, RouterFormValues, RouterHealth, RouterStatus } from "../types/router"

interface RouterFilters {
  search?: string
  status?: RouterStatus | ""
  zone?: string
}

export const getRouters = async (filters: RouterFilters = {}) => {
  const { data } = await api.get<ManagedRouter[]>("/routers", {
    params: {
      search: filters.search?.trim() || undefined,
      status: filters.status || undefined,
      zone: filters.zone?.trim() || undefined,
    },
    cancelKey: `routers:${filters.search ?? ""}:${filters.status ?? ""}:${filters.zone ?? ""}`,
  })
  return data
}

export const getRouterById = async (id: string) => {
  const { data } = await api.get<ManagedRouter>(`/routers/${id}`)
  return data
}

export const createRouter = async (payload: RouterFormValues) => {
  const { data } = await api.post<ManagedRouter>("/routers", payload)
  return data
}

export const updateRouter = async (id: string, payload: RouterFormValues) => {
  const { data } = await api.put<ManagedRouter>(`/routers/${id}`, payload)
  return data
}

export const deleteRouter = async (id: string) => {
  await api.delete(`/routers/${id}`)
}

export const testRouterConnection = async (payload: RouterFormValues) => {
  const { data } = await api.post<RouterConnectionResult>("/routers/test-connection", payload)
  return data
}

export const testRouterConnectionById = async (id: string) => {
  const { data } = await api.post<RouterConnectionResult>(`/routers/${id}/test-connection`)
  return data
}

export const getRouterHealth = async (id: string) => {
  const { data } = await api.get<RouterHealth>(`/routers/${id}/health`, { cancelKey: `router-health:${id}` })
  return data
}

