export interface SupportOverviewTicketActivity {
  id: string
  title: string
  status: string
  priority: string
  clientName: string
  updatedAt: string
}

export interface SupportOverviewPayload {
  windowDays: number
  windowStartAt?: string
  generatedAt: string
  tickets: {
    total: number
    open: number
    inProgress: number
    waiting: number
    resolved: number
    closed: number
  }
  visits: {
    total: number
    scheduled: number
    inProgress: number
    completed: number
    canceled: number
    overdueScheduled: number
  }
  recentTicketActivity: SupportOverviewTicketActivity[]
}
