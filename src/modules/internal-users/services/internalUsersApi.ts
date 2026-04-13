import api from "@/api/axios"
import type { InternalUser, InternalUserFormValues } from "../types/internalUser"

export const getInternalUsers = async () => {
  const { data } = await api.get<InternalUser[]>("/internal-users", { cancelKey: "list" })
  return data
}

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
