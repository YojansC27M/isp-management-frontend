export interface Client {
  id: string
  name: string
  document: string
  address: string
  phone: string
  email: string
  plan: string
  ipAddress: string
  status: string
  latitude: number | null
  longitude: number | null
}
