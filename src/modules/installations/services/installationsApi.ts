import api from "@/api/axios"
import type { Installation, InstallationFormValues, InstallationMovement } from "../types/installation"

export interface InstallationListFilters {
  search?: string
  status?: Installation["status"] | ""
  operationType?: Installation["operationType"] | ""
}

export const getInstallationById = async (id: string) => {
  const { data } = await api.get<Installation>(`/installations/${id}`)
  return data
}

export const getInstallations = async (filters: InstallationListFilters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value)))
  const { data } = await api.get<Installation[]>("/installations", { params, cancelKey: `installations:${JSON.stringify(params)}` })
  return data
}

export const getClientInstallation = async (clientId: string) => {
  const { data } = await api.get<Installation | null>(`/installations/client/${clientId}`, {
    cancelKey: `installation-client:${clientId}`,
  })
  return data
}

export const getClientInstallationMovements = async (clientId: string) => {
  const { data } = await api.get<InstallationMovement[]>(`/installations/client/${clientId}/movements`, {
    cancelKey: `installation-movements:${clientId}`,
  })
  return data
}

export const getRouterInstallations = async (routerId: string) => {
  const { data } = await api.get<Installation[]>(`/installations/router/${routerId}`, {
    cancelKey: `installation-router:${routerId}`,
  })
  return data
}

const toPayload = (values: InstallationFormValues) => ({
  ...values,
  clientId: values.clientId.trim(),
  visitId: values.visitId.trim() || undefined,
  routerId: values.routerId.trim() || undefined,
  operationType: values.operationType,
  notes: values.notes.trim() || undefined,
  installedAt: values.installedAt ? new Date(values.installedAt).toISOString() : undefined,
})

export const createInstallation = async (values: InstallationFormValues) => {
  const { data } = await api.post<Installation>("/installations", toPayload(values))
  return data
}

export const updateInstallation = async (id: string, values: InstallationFormValues) => {
  const { data } = await api.put<Installation>(`/installations/${id}`, toPayload(values))
  return data
}

export const deleteInstallation = async (id: string) => {
  const { data } = await api.delete<{ ok: true }>(`/installations/${id}`)
  return data
}
