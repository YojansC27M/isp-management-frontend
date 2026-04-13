import api from "@/api/axios"
import type { AccountStatusItem, Payment, PaymentFormValues } from "../types/payment"

export const getPayments = async () => {
  const { data } = await api.get<Payment[]>("/payments", { cancelKey: "list" })
  return data
}

export const getPaymentById = async (id: string) => {
  const { data } = await api.get<Payment>(`/payments/${id}`)
  return data
}

export const createPayment = async (payload: PaymentFormValues) => {
  const { data } = await api.post<Payment>("/payments", payload)
  return data
}

export const getAccountStatusByClient = async (clientId: string) => {
  const { data } = await api.get<AccountStatusItem[]>(`/payments/account-status/${clientId}`, {
    cancelKey: `account-status:${clientId}`,
  })
  return data
}
