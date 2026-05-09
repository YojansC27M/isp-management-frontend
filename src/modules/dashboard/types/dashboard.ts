export type DashboardOperationStatus = "online" | "degraded" | "critical"
export type DashboardIncidentSeverity = "high" | "medium" | "low"

export interface DashboardOverview {
  generatedAt: string
  operationStatus: DashboardOperationStatus
  summary: {
    activeClients: number
    openTickets: number
    visitsToday: number
    avgLatencyMs: number | null
    monthRevenue: number
    overdueInvoices: number
    routersTotal: number
    routersOnline: number
    uptimePercent: number
    alertsCount: number
  }
  incidents: Array<{
    id: string
    title: string
    detail: string
    severity: DashboardIncidentSeverity
    href?: string
  }>
  activityByHour: Array<{
    label: string
    usagePercent: number
  }>
  reporting: {
    totalRevenue: number
    totalOverdue: number
    totalPaid: number
    totalPending: number
  }
  formatting: {
    currency: string
    timezone: string
  }
}
