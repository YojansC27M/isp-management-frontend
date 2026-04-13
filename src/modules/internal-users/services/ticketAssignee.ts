import { getInternalUsers } from "./internalUsersApi"
import { getTickets } from "@/modules/tickets/services/ticketsApi"
import type { TicketCategory, TicketStatus } from "@/modules/tickets/types/ticket"
import type { InternalUserRole } from "../types/internalUser"

export interface TicketAssigneeOption {
  id: string
  name: string
  role: InternalUserRole
  currentLoad: number
}

const ACTIVE_TICKET_STATUSES: TicketStatus[] = ["open", "in_progress"]

const rolesByCategory: Record<TicketCategory, InternalUserRole[]> = {
  billing: ["support", "staff", "admin"],
  technical: ["support", "staff", "admin"],
  installation: ["support", "staff", "admin"],
}

export const getTicketAssigneeOptions = async (category: TicketCategory): Promise<TicketAssigneeOption[]> => {
  const [users, tickets] = await Promise.all([getInternalUsers(), getTickets()])
  const orderedRoles = rolesByCategory[category]
  const allowedRoles = new Set(orderedRoles)
  const rolePriority = new Map<InternalUserRole, number>(
    orderedRoles.map((role, index) => [role, index]),
  )

  return users
    .filter((user) => user.status === "active" && allowedRoles.has(user.role))
    .map((user) => {
      const currentLoad = tickets.filter(
        (ticket) => ticket.assignedUserId === user.id && ACTIVE_TICKET_STATUSES.includes(ticket.status),
      ).length

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        currentLoad,
      }
    })
    .sort((a, b) => {
      const roleDelta = (rolePriority.get(a.role) ?? Number.MAX_SAFE_INTEGER) - (rolePriority.get(b.role) ?? Number.MAX_SAFE_INTEGER)
      if (roleDelta !== 0) return roleDelta
      if (a.currentLoad !== b.currentLoad) return a.currentLoad - b.currentLoad
      return a.name.localeCompare(b.name)
    })
}

export const suggestTicketAssignee = async (category: TicketCategory) => {
  const options = await getTicketAssigneeOptions(category)
  return options[0] ?? null
}
