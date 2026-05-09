import api from "@/api/axios"
import type {
  ClientInvoice,
  ClientPayment,
  ClientPortalCreateTicketPayload,
  ClientPortalLoginPayload,
  ClientPortalLoginResult,
  ClientProfile,
  ClientTicket,
} from "../types/clientPortal"

export const login = async (email: string, password: string) => {
  const payload: ClientPortalLoginPayload = { email, password }
  const { data } = await api.post<ClientPortalLoginResult>("/client-portal/login", payload)
  return data
}

export const getProfile = async () => {
  const { data } = await api.get<ClientProfile>("/client-portal/profile", { cancelKey: "profile" })
  return data
}

export const getInvoices = async () => {
  const { data } = await api.get<ClientInvoice[]>("/client-portal/invoices", { cancelKey: "invoices" })
  return data
}

export const getPayments = async () => {
  const { data } = await api.get<ClientPayment[]>("/client-portal/payments", { cancelKey: "payments" })
  return data
}

export const getTickets = async () => {
  const { data } = await api.get<ClientTicket[]>("/client-portal/tickets", { cancelKey: "tickets" })
  return data
}

export const createTicket = async (payload: ClientPortalCreateTicketPayload, attachments?: File[] | null) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, String(value ?? ""))
  })
  if (attachments?.length) {
    attachments.forEach((attachment) => {
      formData.append("attachment", attachment)
    })
  }

  const { data } = await api.post<ClientTicket>("/client-portal/tickets", formData)
  return data
}

export const changePortalPassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await api.post<{ ok: boolean }>("/client-portal/change-password", {
    currentPassword,
    newPassword,
  })
  return data
}

const downloadBlobFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadInvoicePdf = async (invoiceId: string) => {
  const { data } = await api.get<Blob>(`/client-portal/invoices/${invoiceId}/pdf`, {
    responseType: "blob",
  })
  downloadBlobFile(data, `invoice-${invoiceId}.pdf`)
}

export const downloadPaymentReceipt = async (paymentId: string) => {
  const { data } = await api.get<Blob>(`/client-portal/payments/${paymentId}/receipt`, {
    responseType: "blob",
  })
  downloadBlobFile(data, `payment-${paymentId}.pdf`)
}
