import api from "@/api/axios"
import type { Client } from "../types/client"

export type ClientPayload = Omit<Client, "id">

export const getClients = async () => {
  const { data } = await api.get<Client[]>("/clients")
  return data
}

export const getClientById = async (id: string) => {
  const { data } = await api.get<Client>(`/clients/${id}`)
  return data
}

export const createClient = async (payload: ClientPayload) => {
  const { data } = await api.post<Client>("/clients", payload)
  return data
}

export const updateClient = async (id: string, payload: ClientPayload) => {
  const { data } = await api.put<Client>(`/clients/${id}`, payload)
  return data
}

export const deleteClient = async (id: string) => {
  const { data } = await api.delete<void>(`/clients/${id}`)
  return data
}
