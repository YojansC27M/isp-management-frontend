import api from "@/api/axios"
import type { Client, ClientFormValues } from "../types/client"

export const getClients = async () => {
  const { data } = await api.get<Client[]>("/clients")
  return data
}

export const getClientById = async (id: string) => {
  const { data } = await api.get<Client>(`/clients/${id}`)
  return data
}

export const createClient = async (payload: ClientFormValues) => {
  const { data } = await api.post<Client>("/clients", payload)
  return data
}

export const updateClient = async (id: string, payload: ClientFormValues) => {
  const { data } = await api.put<Client>(`/clients/${id}`)
  return data
}

export const deleteClient = async (id: string) => {
  const { data } = await api.delete<void>(`/clients/${id}`)
  return data
}
