export type PaymentMethod = "cash" | "transfer" | "card" | "pse" | "other"
export type PaymentStatus = "pending" | "paid" | "overdue" | "refunded"
export type AccountInvoiceStatus = "pending" | "paid" | "overdue" | "cancelled"
export type PaymentSortBy = "paymentDate" | "amount" | "status" | "invoiceNumber" | "createdAt"
export type PaymentSortDir = "asc" | "desc"

export interface Payment {
  id: string
  clientId: string
  clientName: string
  invoiceNumber: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
}

export interface PaymentFormValues {
  clientId: string
  invoiceNumber: string
  amount: number
  paymentMethod: PaymentMethod
  paymentDate: string
  status: PaymentStatus
}

export interface AccountStatusItem {
  id: string
  invoiceNumber: string
  dueDate: string
  amount: number
  status: AccountInvoiceStatus
}

export interface PaymentsListQuery {
  search?: string
  status?: PaymentStatus | ""
  page?: number
  perPage?: number
  sortBy?: PaymentSortBy
  sortDir?: PaymentSortDir
}

export interface PaymentsPageMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface PaymentsPageResponse {
  items: Payment[]
  meta: PaymentsPageMeta
}
