export interface ReportMetrics {
  totalRevenue: number
  totalPending: number
  totalOverdue: number
  totalPaid: number
}

export interface RevenueData {
  date: string
  amount: number
}

export interface StatusDistribution {
  status: "pending" | "paid" | "overdue"
  count: number
}

export interface OverdueClient {
  id: string
  name: string
  amountDue: number
  daysOverdue: number
}

export interface ReportsFiltersValues {
  dateFrom: string
  dateTo: string
  zone: string
  plan: string
}

export interface OperationsMetrics {
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  scheduledVisits: number
  completedVisits: number
  pendingInstallations: number
  completedInstallations: number
}
