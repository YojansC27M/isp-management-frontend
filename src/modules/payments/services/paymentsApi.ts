import api from "@/api/axios"
import { buildPaymentsParams } from "../lib/query"
import type { AccountStatusItem, Payment, PaymentFormValues, PaymentsListQuery, PaymentsPageMeta, PaymentsPageResponse } from "../types/payment"

interface PaymentsRequestOptions {
  cancel?: boolean
  query?: PaymentsListQuery
}

export const getPayments = async (options?: PaymentsRequestOptions) => {
  const config = {
    ...(options?.cancel === false ? {} : { cancelKey: "list" }),
    ...(options?.query ? { params: buildPaymentsParams(options.query) } : {}),
  }
  const { data } = await api.get<Payment[]>("/payments", config)
  return data
}

const DEFAULT_PAYMENTS_META: PaymentsPageMeta = {
  page: 1,
  perPage: 25,
  total: 0,
  totalPages: 1,
}

const normalizePaymentsMeta = (meta?: Partial<PaymentsPageMeta>): PaymentsPageMeta => {
  return {
    page: meta?.page && meta.page > 0 ? meta.page : DEFAULT_PAYMENTS_META.page,
    perPage: meta?.perPage && meta.perPage > 0 ? meta.perPage : DEFAULT_PAYMENTS_META.perPage,
    total: meta?.total && meta.total >= 0 ? meta.total : DEFAULT_PAYMENTS_META.total,
    totalPages: meta?.totalPages && meta.totalPages > 0 ? meta.totalPages : DEFAULT_PAYMENTS_META.totalPages,
  }
}

export const getPaymentsPage = async (query: PaymentsListQuery = {}) => {
  const params = buildPaymentsParams(query)
  const { data } = await api.get<PaymentsPageResponse>("/payments/page", {
    params,
    cancelKey: `payments:page:${params.page}:${params.perPage}:${params.search ?? ""}:${params.status ?? ""}:${params.sortBy}:${params.sortDir}`,
  })
  return {
    items: data.items ?? [],
    meta: normalizePaymentsMeta(data.meta),
  }
}

export const getPaymentById = async (id: string) => {
  const { data } = await api.get<Payment>(`/payments/detail/${id}`)
  return data
}

export const createPayment = async (payload: PaymentFormValues) => {
  const { data } = await api.post<Payment>("/payments", payload)
  return data
}

export const updatePayment = async (id: string, payload: PaymentFormValues) => {
  const { data } = await api.put<Payment>(`/payments/detail/${id}`, payload)
  return data
}

export const deletePayment = async (id: string) => {
  const { data } = await api.delete<{ ok: true }>(`/payments/detail/${id}`)
  return data
}

export const getAccountStatusByClient = async (clientId: string, options?: PaymentsRequestOptions) => {
  const config =
    options?.cancel === false
      ? undefined
      : {
          cancelKey: `account-status:${clientId}`,
        }
  const { data } = await api.get<AccountStatusItem[]>(`/payments/account-status/${clientId}`, config)
  return data
}
