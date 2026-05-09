import api from "@/api/axios"
import type { Ticket, TicketComment, TicketCommentVisibility, TicketFormValues } from "../types/ticket"

interface TicketsRequestOptions {
  cancel?: boolean
}

export const getTickets = async (options?: TicketsRequestOptions) => {
  const config = options?.cancel === false ? undefined : { cancelKey: "list" }
  const { data } = await api.get<Ticket[]>("/tickets", config)
  return data
}

export const getTicketById = async (id: string) => {
  const { data } = await api.get<Ticket>(`/tickets/${id}`)
  return data
}

export const getClientTickets = async (clientId: string) => {
  const { data } = await api.get<Ticket[]>(`/clients/${clientId}/tickets`, {
    cancelKey: `client-tickets:${clientId}`,
  })
  return data
}

export const createTicket = async (payload: TicketFormValues, attachments?: File[] | null) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    formData.append(key, String(value ?? ""))
  })
  if (attachments?.length) {
    attachments.forEach((attachment) => {
      formData.append("attachment", attachment)
    })
  }

  const { data } = await api.post<Ticket>("/tickets", formData)
  return data
}

export const updateTicket = async (id: string, payload: TicketFormValues) => {
  const { data } = await api.put<Ticket>(`/tickets/${id}`, payload)
  return data
}

export const deleteTicket = async (id: string) => {
  const { data } = await api.delete<{ ok: true }>(`/tickets/${id}`)
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
