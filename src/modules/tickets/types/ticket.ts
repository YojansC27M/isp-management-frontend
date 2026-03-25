export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high"
export type TicketCategory = "technical" | "billing" | "installation"

export interface Ticket {
  id: string
  clientId: string
  clientName: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  createdAt: string
}

export interface TicketFormValues {
  clientId: string
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
}
