import type { Role } from "@/auth/types"

export type InternalUserStatus = "active" | "inactive"
export type InternalUserRole = Extract<Role, "admin" | "staff" | "technician" | "support">

export interface TechnicianAvailabilitySlot {
  id: string
  label: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface TechnicianProfile {
  coverageZones: string[]
  availability: TechnicianAvailabilitySlot[]
  skills: string[]
}

export interface InternalUser {
  id: string
  name: string
  email: string
  phone: string
  role: InternalUserRole
  status: InternalUserStatus
  technicianProfile: TechnicianProfile | null
}

export interface InternalUserFormValues {
  name: string
  email: string
  phone: string
  role: InternalUserRole
  status: InternalUserStatus
  technicianProfile: TechnicianProfile | null
}

export interface TechnicianAssignmentContext {
  zone?: string
  scheduledDate?: string
  scheduledTime?: string
  excludeVisitId?: string
}

export interface TechnicianAssignmentOption {
  id: string
  name: string
  coverageZones: string[]
  availability: TechnicianAvailabilitySlot[]
  skills: string[]
  currentLoad: number
  availableForContext: boolean
  unavailableReason?: string
}

export const INTERNAL_USER_ROLE_OPTIONS: { value: InternalUserRole; label: string }[] = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Administrador" },
  { value: "technician", label: "Tecnico" },
  { value: "support", label: "Soporte" },
]

export const TECHNICIAN_AVAILABILITY_PRESETS: TechnicianAvailabilitySlot[] = [
  { id: "mon-am", label: "Lunes 08:00-12:00", dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
  { id: "mon-pm", label: "Lunes 13:00-18:00", dayOfWeek: 1, startTime: "13:00", endTime: "18:00" },
  { id: "tue-am", label: "Martes 08:00-12:00", dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
  { id: "tue-pm", label: "Martes 13:00-18:00", dayOfWeek: 2, startTime: "13:00", endTime: "18:00" },
  { id: "wed-am", label: "Miercoles 08:00-12:00", dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
  { id: "wed-pm", label: "Miercoles 13:00-18:00", dayOfWeek: 3, startTime: "13:00", endTime: "18:00" },
  { id: "thu-am", label: "Jueves 08:00-12:00", dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
  { id: "thu-pm", label: "Jueves 13:00-18:00", dayOfWeek: 4, startTime: "13:00", endTime: "18:00" },
  { id: "fri-am", label: "Viernes 08:00-12:00", dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
  { id: "fri-pm", label: "Viernes 13:00-18:00", dayOfWeek: 5, startTime: "13:00", endTime: "18:00" },
  { id: "sat-am", label: "Sabado 08:00-12:00", dayOfWeek: 6, startTime: "08:00", endTime: "12:00" },
]
