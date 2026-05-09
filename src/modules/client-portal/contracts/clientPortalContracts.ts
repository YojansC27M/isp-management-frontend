export type ClientPortalProfileStatus = "active" | "suspended" | "inactive"
export type ClientPortalInvoiceStatus = "pending" | "paid" | "overdue"
export type ClientPortalPaymentMethod = "card" | "transfer" | "cash" | "pse" | "other"
export type ClientPortalTicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed"
export type ClientPortalTicketPriority = "low" | "medium" | "high"
export type ClientPortalTicketCategory = "technical" | "billing" | "installation"

export interface ClientPortalTicketAttachment {
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
}

export interface ClientPortalLoginRequest {
  email: string
  password: string
}

export interface ClientPortalLoginResponse {
  token: string
  clientId?: string
  expiresInSeconds?: number
  mustChangePassword?: boolean
}

export interface ClientPortalProfileResponse {
  id: string
  name: string
  email: string
  plan: string
  status: ClientPortalProfileStatus
  ipAddress: string
  serviceAddress?: string
  accountNumber?: string
  balance?: number
  openTickets?: number
  nextDueDate?: string
  lastPaymentDate?: string
  lastAccessAt?: string
  serviceStatus?: string
}

export interface ClientPortalInvoiceResponse {
  id: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: ClientPortalInvoiceStatus
  issueDate?: string
  period?: string
  paidAt?: string
  paymentReference?: string
  paymentLink?: string
  downloadUrl?: string
}

export interface ClientPortalPaymentResponse {
  id: string
  amount: number
  paymentDate: string
  method: ClientPortalPaymentMethod
  status?: ClientPortalInvoiceStatus
  invoiceNumber?: string
  reference?: string
  receiptUrl?: string
}

export interface ClientPortalTicketResponse {
  id: string
  title: string
  status: ClientPortalTicketStatus
  createdAt: string
  priority?: ClientPortalTicketPriority
  updatedAt?: string
  channel?: "web" | "email" | "phone" | "whatsapp"
  messageCount?: number
  attachment?: ClientPortalTicketAttachment | null
  attachments?: ClientPortalTicketAttachment[] | null
}

export interface ClientPortalCreateTicketRequest {
  title: string
  description: string
  priority: ClientPortalTicketPriority
  category: ClientPortalTicketCategory
}
