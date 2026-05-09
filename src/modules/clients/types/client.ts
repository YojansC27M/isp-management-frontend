export type ClientStatus = 'active' | 'suspended' | 'inactive'

export interface Client {
  id: string
  name: string
  document: string
  address: string
  phone: string
  email: string
  planId: string | null
  plan: string
  ipAddress: string
  status: ClientStatus
  latitude: number | null
  longitude: number | null
}

export interface ClientFormValues {
  name: string
  document: string
  address: string
  phone: string
  email: string
  planId: string
  ipAddress: string
  status: ClientStatus
  latitude: number | null
  longitude: number | null
}
