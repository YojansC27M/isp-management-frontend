export type ClientMapStatus = "active" | "suspended" | "inactive"

export interface ClientMapItem {
  id: string
  name: string
  document: string
  phone: string
  plan: string
  status: ClientMapStatus
  technicianName: string
  zone: string
  latitude: number
  longitude: number
}

export interface ClientMapFiltersValues {
  status: ClientMapStatus | ""
  zone: string
  technicianName: string
}
