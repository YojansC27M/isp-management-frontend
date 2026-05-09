export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high"
export type TicketCategory = "technical" | "billing" | "installation"
export type TicketCommentVisibility = "public" | "internal"

export interface TicketHistoryEntry {
  id: string
  ticketId: string
  message: string
  createdAt: string
}

export interface TicketAttachment {
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
}

export interface Ticket {
  id: string
  clientId: string
  assignedUserId: string
  assignedUserName: string
  clientName: string
  clientPhone: string
  assignedTechnicianId: string
  assignedTechnicianName: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  attachment?: TicketAttachment | null
  attachments?: TicketAttachment[] | null
  createdAt: string
  history: TicketHistoryEntry[]
}

export interface TicketFormValues {
  clientId: string
  assignedUserId: string
  assignedUserName: string
  assignedTechnicianId: string
  assignedTechnicianName: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
}

export interface TicketComment {
  id: string
  ticketId: string
  message: string
  createdAt: string
  author: string
  visibility: TicketCommentVisibility
}
