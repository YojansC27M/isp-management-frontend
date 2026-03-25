export type VisitType = "installation" | "maintenance" | "support"
export type VisitStatus = "scheduled" | "in_progress" | "completed" | "canceled"

export interface Visit {
  id: string
  clientId: string
  clientName: string
  technicianId: string
  technicianName: string
  zone: string
  type: VisitType
  scheduledDate: string
  scheduledTime: string
  status: VisitStatus
  notes: string
}

export interface VisitFormValues {
  clientId: string
  technicianId: string
  zone: string
  type: VisitType
  scheduledDate: string
  scheduledTime: string
  status: VisitStatus
  notes: string
}
