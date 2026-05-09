import { getClientsMap } from "@/modules/clients-map/services/clientsMapApi"
import { getTickets } from "@/modules/tickets/services/ticketsApi"
import { getVisits } from "@/modules/visits/services/visitsApi"
import { getInternalUsers } from "./internalUsersApi"
import type {
  TechnicianAssignmentContext,
  TechnicianAssignmentOption,
  TechnicianAvailabilitySlot,
} from "../types/internalUser"

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

const normalize = (value: string) => value.trim().toLowerCase()

const hasZoneCoverage = (coverageZones: string[], zone?: string) => {
  if (!zone?.trim()) return true
  const normalizedZone = normalize(zone)
  return coverageZones.map(normalize).includes(normalizedZone)
}

const hasAvailability = (availability: TechnicianAvailabilitySlot[], scheduledDate?: string, scheduledTime?: string) => {
  if (!scheduledDate || !scheduledTime) return true
  if (availability.length === 0) return true

  const date = new Date(`${scheduledDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return true

  const dayOfWeek = date.getDay()
  const scheduledMinutes = toMinutes(scheduledTime)

  return availability.some((slot) => {
    if (slot.dayOfWeek !== dayOfWeek) return false
    const start = toMinutes(slot.startTime)
    const end = toMinutes(slot.endTime)
    return scheduledMinutes >= start && scheduledMinutes <= end
  })
}

const hasVisitConflict = (
  technicianId: string,
  scheduledDate?: string,
  scheduledTime?: string,
  excludeVisitId?: string,
  visits: Awaited<ReturnType<typeof getVisits>> = [],
) => {
  if (!scheduledDate || !scheduledTime) return false
  return visits.some(
    (visit) =>
      visit.id !== excludeVisitId &&
      visit.technicianId === technicianId &&
      visit.scheduledDate === scheduledDate &&
      visit.scheduledTime === scheduledTime &&
      (visit.status === "scheduled" || visit.status === "in_progress"),
  )
}

const buildUnavailableReason = ({
  zoneMatch,
  availabilityMatch,
  conflict,
}: {
  zoneMatch: boolean
  availabilityMatch: boolean
  conflict: boolean
}) => {
  if (!zoneMatch) return "No cubre la zona"
  if (!availabilityMatch) return "Sin disponibilidad en esa franja"
  if (conflict) return "Ya tiene una visita en ese horario"
  return "No disponible"
}

export const getClientZone = async (clientId: string) => {
  if (!clientId.trim()) return ""
  const mapItems = await getClientsMap()
  const match = mapItems.find((item) => item.id === clientId.trim())
  return match?.zone ?? ""
}

export const getTechnicianAssignmentOptions = async (
  context: TechnicianAssignmentContext,
): Promise<TechnicianAssignmentOption[]> => {
  const [users, tickets, visits] = await Promise.all([getInternalUsers(), getTickets(), getVisits()])

  const activeTechnicians = users.filter((user) => user.role === "technician" && user.status === "active")

  return activeTechnicians
    .map((technician) => {
      const currentLoad =
        tickets.filter(
          (ticket) =>
            ticket.assignedTechnicianId === technician.id && (ticket.status === "open" || ticket.status === "in_progress"),
        ).length +
        visits.filter(
          (visit) =>
            visit.technicianId === technician.id && (visit.status === "scheduled" || visit.status === "in_progress"),
        ).length

      const profile = technician.technicianProfile
      const zoneMatch = hasZoneCoverage(profile?.coverageZones ?? [], context.zone)
      const availabilityMatch = hasAvailability(profile?.availability ?? [], context.scheduledDate, context.scheduledTime)
      const conflict = hasVisitConflict(
        technician.id,
        context.scheduledDate,
        context.scheduledTime,
        context.excludeVisitId,
        visits,
      )

      const availableForContext = zoneMatch && availabilityMatch && !conflict

      return {
        id: technician.id,
        name: technician.name,
        coverageZones: profile?.coverageZones ?? [],
        availability: profile?.availability ?? [],
        skills: profile?.skills ?? [],
        currentLoad,
        availableForContext,
        unavailableReason: availableForContext ? undefined : buildUnavailableReason({ zoneMatch, availabilityMatch, conflict }),
      }
    })
    .sort((a, b) => {
      if (a.availableForContext !== b.availableForContext) {
        return a.availableForContext ? -1 : 1
      }
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad
      }
      return a.name.localeCompare(b.name)
    })
}

export const suggestTechnicianAssignment = async (context: TechnicianAssignmentContext) => {
  const options = await getTechnicianAssignmentOptions(context)
  return options.find((item) => item.availableForContext) ?? null
}

export const isAssignableTechnician = async (technicianId: string) => {
  if (!technicianId.trim()) return true
  const users = await getInternalUsers()
  return users.some((user) => user.id === technicianId && user.role === "technician" && user.status === "active")
}
