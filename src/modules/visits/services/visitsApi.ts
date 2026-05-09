import api from "@/api/axios"
import type { Visit, VisitFormValues } from "../types/visit"

interface VisitsRequestOptions {
  cancel?: boolean
}

export const getVisits = async (options?: VisitsRequestOptions) => {
  const config = options?.cancel === false ? undefined : { cancelKey: "list" }
  const { data } = await api.get<Visit[]>("/visits", config)
  return data
}

export const getVisitById = async (id: string) => {
  const { data } = await api.get<Visit>(`/visits/${id}`)
  return data
}

export const getClientVisits = async (clientId: string) => {
  const { data } = await api.get<Visit[]>(`/clients/${clientId}/visits`)
  return data
}

export const createVisit = async (payload: VisitFormValues) => {
  const { data } = await api.post<Visit>("/visits", payload)
  return data
}

export const updateVisit = async (id: string, payload: VisitFormValues) => {
  const { data } = await api.put<Visit>(`/visits/${id}`, payload)
  return data
}

export const rescheduleVisit = async (id: string, payload: Pick<VisitFormValues, "scheduledDate" | "scheduledTime" | "notes">) => {
  const { data } = await api.post<Visit>(`/visits/${id}/reschedule`, payload)
  return data
}

export const deleteVisit = async (id: string) => {
  const { data } = await api.delete<{ ok: true }>(`/visits/${id}`)
  return data
}
