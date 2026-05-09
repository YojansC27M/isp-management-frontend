export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled"

export interface Invoice {
  id: string
  clientId: string
  clientName: string
  invoiceNumber: string
  amount: number
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  cancelledAt?: string | null
  cancellationReason?: string | null
}

export interface InvoiceFiltersValues {
  clientName: string
  status: InvoiceStatus | ""
  dateFrom: string
  dateTo: string
}

export interface InvoiceAutomationSettings {
  cutDay: number
  prefix: string
  nextCorrelative: number
}

export interface InvoiceFormValues {
  clientId: string
  invoiceNumber: string
  amount: number
  issueDate: string
  dueDate: string
  status: InvoiceStatus
}

export interface InvoiceCancelValues {
  reason: string
}
