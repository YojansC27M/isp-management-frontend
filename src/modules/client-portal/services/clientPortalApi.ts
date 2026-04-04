import api from "@/api/axios"
import type { ClientInvoice, ClientPayment, ClientProfile, ClientTicket } from "../types/clientPortal"

export const login = async (email: string, password: string) => {
  if (import.meta.env.VITE_USE_MOCKS === "true") {
    if (email === "admin@isp.com" && password === "123456") {
      return { token: "mock-client-token" }
    }
    throw new Error("Invalid credentials")
  }
  const { data } = await api.post<{ token: string }>("/client-portal/login", { email, password })
  return data
}

export const getProfile = async () => {
  const { data } = await api.get<ClientProfile>("/client-portal/profile")
  return data
}

export const getInvoices = async () => {
  const { data } = await api.get<ClientInvoice[]>("/client-portal/invoices")
  return data
}

export const getPayments = async () => {
  const { data } = await api.get<ClientPayment[]>("/client-portal/payments")
  return data
}

export const getTickets = async () => {
  const { data } = await api.get<ClientTicket[]>("/client-portal/tickets")
  return data
}
