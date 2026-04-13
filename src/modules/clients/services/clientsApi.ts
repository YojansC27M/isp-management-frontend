import api from "@/api/axios"
import type { Client, ClientFormValues } from "../types/client"

export const getClients = async () => {
  const { data } = await api.get<Client[]>("/clients", { cancelKey: "list" })
  return data
}

export const searchClients = async (query: string, limit = 20) => {
  const normalized = query.trim()
  if (normalized.length < 2) return []
  const { data } = await api.get<Client[]>("/clients/search", {
    params: { q: normalized, limit },
    cancelKey: `search:${normalized}:${limit}`,
  })
  return data
}

export const getClientById = async (id: string) => {
  const { data } = await api.get<Client>(`/clients/${id}`)
  return data
}

export const createClient = async (data: ClientFormValues) => {
  const response = await api.post<Client>("/clients", data)
  return response.data
}

export const updateClient = async (id: string, data: ClientFormValues) => {
  const response = await api.put<Client>(`/clients/${id}`, data)
  return response.data
}

export const deleteClient = async (id: string) => {
  const response = await api.delete<void>(`/clients/${id}`)
  return response.data
}
