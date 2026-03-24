export type PaymentMethod = "cash" | "transfer" | "card" | "pse"
export type PaymentStatus = "pending" | "paid" | "overdue"

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
  status: PaymentStatus
}
