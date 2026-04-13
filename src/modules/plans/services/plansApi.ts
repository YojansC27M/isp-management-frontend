import api from "@/api/axios"
import type { Plan, PlanFormValues } from "../types/plan"

export const getPlans = async () => {
  const { data } = await api.get<Plan[]>("/plans", { cancelKey: "list" })
  return data
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
