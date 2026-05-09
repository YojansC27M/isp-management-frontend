export type RouterStatus = "online" | "offline"

export interface ManagedRouter {
  id: string
  name: string
  ip: string
  port: number
  username: string
  passwordMasked: string
  zone: string
  location: string
  latitude: number | null
  longitude: number | null
  status: RouterStatus
  lastCheckedAt: string
}

export interface RouterFormValues {
  name: string
  ip: string
  port: number
  username: string
  password: string
  zone: string
  location: string
  latitude: number | null
  longitude: number | null
}

export interface RouterConnectionResult {
  success: boolean
  message: string
  latencyMs: number | null
  checkedAt: string
}

export interface RouterConnectionPayload {
  ip: string
  port: number
  username: string
  password: string
}

export interface RouterHealth {
  cpuUsage: number
  ramUsage: number
  uptime: string
  interfacesUp: number
  interfacesDown: number
  throughput: string
}

export interface RouterBackup {
  id: string
  fileName: string
  createdAt: string
  sizeBytes: number
  checksum: string
  source: "mikrotik" | "manual"
}
