export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high"
export type TicketCategory = "technical" | "billing" | "installation"
export type TicketCommentVisibility = "public" | "internal"

export interface TicketHistoryEntry {
  id: string
  ticketId: string
  message: string
  createdAt: string
}

export interface Ticket {
  id: string
  clientId: string
  clientName: string
  assignedTechnicianId: string
  assignedTechnicianName: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  createdAt: string
  history: TicketHistoryEntry[]
}

export interface TicketFormValues {
  clientId: string
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
