import api from "@/api/axios"
import type { Ticket, TicketComment, TicketCommentVisibility, TicketFormValues } from "../types/ticket"

export const getTickets = async () => {
  const { data } = await api.get<Ticket[]>("/tickets", { cancelKey: "list" })
  return data
}

export const getTicketById = async (id: string) => {
  const { data } = await api.get<Ticket>(`/tickets/${id}`)
  return data
}

export const createTicket = async (payload: TicketFormValues) => {
  const { data } = await api.post<Ticket>("/tickets", payload)
  return data
}

export const updateTicket = async (id: string, payload: TicketFormValues) => {
  const { data } = await api.put<Ticket>(`/tickets/${id}`, payload)
  return data
}

export const addComment = async (ticketId: string, message: string, visibility: TicketCommentVisibility) => {
  const { data } = await api.post<TicketComment>(`/tickets/${ticketId}/comments`, { message, visibility })
  return data
}

export const getTicketComments = async (ticketId: string) => {
  const { data } = await api.get<TicketComment[]>(`/tickets/${ticketId}/comments`, {
    cancelKey: `comments:${ticketId}`,
  })
  return data
}
