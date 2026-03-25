export type InvoiceStatus = "pending" | "paid" | "overdue"

export interface Invoice {
  id: string
  clientId: string
  clientName: string
  invoiceNumber: string
  amount: number
  issueDate: string
  dueDate: string
  status: InvoiceStatus
}

export interface InvoiceFiltersValues {
  clientName: string
  status: InvoiceStatus | ""
  dateFrom: string
  dateTo: string
}
