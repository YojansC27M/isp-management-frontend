import api from "@/api/axios"
import type { Ticket, TicketComment, TicketFormValues } from "../types/ticket"

export const getTickets = async () => {
  const { data } = await api.get<Ticket[]>("/tickets")
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

export const addComment = async (ticketId: string, message: string) => {
  const { data } = await api.post<TicketComment>(`/tickets/${ticketId}/comments`, { message })
  return data
}
