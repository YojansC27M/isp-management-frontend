import api from "@/api/axios"
import type { InterfaceStatus, Router, RouterMetrics } from "../types/monitoring"

export const getRouters = async () => {
  const { data } = await api.get<Router[]>("/monitoring/routers")
  return data
}

export const getRouterMetrics = async (routerId: string) => {
  const { data } = await api.get<RouterMetrics>(`/monitoring/routers/${routerId}/metrics`)
  return data
}

export const getRouterInterfaces = async (routerId: string) => {
  const { data } = await api.get<InterfaceStatus[]>(`/monitoring/routers/${routerId}/interfaces`)
  return data
}
