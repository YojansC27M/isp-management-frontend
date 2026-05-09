import api from "@/api/axios"
import type { Invoice, InvoiceAutomationSettings, InvoiceCancelValues, InvoiceFormValues } from "../types/invoice"

interface InvoicesRequestOptions {
  cancel?: boolean
}

export const getInvoices = async (options?: InvoicesRequestOptions) => {
  const config = options?.cancel === false ? undefined : { cancelKey: "list" }
  const { data } = await api.get<Invoice[]>("/invoices", config)
  return data
}

export const getInvoiceById = async (id: string) => {
  const { data } = await api.get<Invoice>(`/invoices/${id}`)
  return data
}

export const createInvoice = async (payload: InvoiceFormValues) => {
  const { data } = await api.post<Invoice>("/invoices", payload)
  return data
}

export const updateInvoice = async (id: string, payload: InvoiceFormValues) => {
  const { data } = await api.put<Invoice>(`/invoices/${id}`, payload)
  return data
}

export const cancelInvoice = async (id: string, payload: InvoiceCancelValues) => {
  const { data } = await api.post<Invoice>(`/invoices/${id}/cancel`, payload)
  return data
}

export const downloadInvoicePdf = async (id: string) => {
  const response = await api.get<Blob>(`/invoices/${id}/pdf`, { responseType: "blob" })
  return response.data
}

export const getInvoiceAutomationSettings = async () => {
  const { data } = await api.get<InvoiceAutomationSettings>("/invoices/automation/settings")
  return data
}

export const updateInvoiceAutomationSettings = async (payload: InvoiceAutomationSettings) => {
  const { data } = await api.put<InvoiceAutomationSettings>("/invoices/automation/settings", payload)
  return data
}
