import api from "@/api/axios"
import type { Visit, VisitFormValues } from "../types/visit"

export const getVisits = async () => {
  const { data } = await api.get<Visit[]>("/visits", { cancelKey: "list" })
  return data
}

export const getVisitById = async (id: string) => {
  const { data } = await api.get<Visit>(`/visits/${id}`)
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

export const findTechnicianConflict = async (payload: Pick<VisitFormValues, "technicianId" | "scheduledDate" | "scheduledTime">) => {
  if (!payload.technicianId.trim()) return null
  const visits = await getVisits()
  const conflict = visits.find(
    (visit) =>
      visit.technicianId === payload.technicianId &&
      visit.scheduledDate === payload.scheduledDate &&
      visit.scheduledTime === payload.scheduledTime &&
      visit.status !== "canceled",
  )
  return conflict ?? null
}
