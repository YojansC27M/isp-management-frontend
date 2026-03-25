export type RouterStatus = "online" | "offline"
export type InterfaceStatusType = "up" | "down"

export interface Router {
  id: string
  name: string
  ip: string
  location: string
  status: RouterStatus
}

export interface RouterMetrics {
  cpuUsage: number
  ramUsage: number
  uptime: string
  totalTraffic: string
}

export interface InterfaceStatus {
  name: string
  status: InterfaceStatusType
  rx: string
  tx: string
}
