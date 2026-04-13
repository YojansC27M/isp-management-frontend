import api from "@/api/axios"
import type { Invoice } from "../types/invoice"

export const getInvoices = async () => {
  const { data } = await api.get<Invoice[]>("/invoices", { cancelKey: "list" })
  return data
}

export const getInvoiceById = async (id: string) => {
  const { data } = await api.get<Invoice>(`/invoices/${id}`)
  return data
}

export const downloadInvoicePdf = async (id: string) => {
  const response = await api.get<Blob>(`/invoices/${id}/pdf`, { responseType: "blob" })
  return response.data
}
