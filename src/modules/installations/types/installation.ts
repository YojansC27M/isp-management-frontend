import type { ClientStatus } from "@/modules/clients/types/client"

export type InstallationStatus = "pending" | "scheduled" | "installed" | "suspended" | "canceled"
export type InstallationOperationType = "installation" | "relocation" | "replacement" | "removal"

export interface InstallationMovement {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientAddress: string
  clientStatus: ClientStatus
  clientPlan: string
  installationId: string | null
  visitId: string | null
  visitType: string
  visitStatus: string
  visitScheduledAt: string | null
  routerId: string | null
  routerName: string
  routerIp: string
  routerZone: string
  routerLocation: string
  routerStatus: string
  operationType: InstallationOperationType
  status: InstallationStatus
  notes: string
  happenedAt: string
  createdAt: string
}

export interface Installation {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  clientAddress: string
  clientStatus: ClientStatus
  clientPlan: string
  visitId: string | null
  visitType: string
  visitStatus: string
  visitScheduledAt: string | null
  routerId: string | null
  routerName: string
  routerIp: string
  routerZone: string
  routerLocation: string
  routerStatus: string
  operationType: InstallationOperationType
  status: InstallationStatus
  installedAt: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface InstallationFormValues {
  clientId: string
  visitId: string
  routerId: string
  operationType: InstallationOperationType
  status: InstallationStatus
  installedAt: string
  notes: string
}
