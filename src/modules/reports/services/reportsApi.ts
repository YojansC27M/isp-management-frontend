import api from "@/api/axios"
import type { OverdueClient, ReportMetrics, ReportsFiltersValues, RevenueData, StatusDistribution } from "../types/report"

export const getReportMetrics = async (filters: ReportsFiltersValues) => {
  const { data } = await api.get<ReportMetrics>("/reports/metrics", { params: filters, cancelKey: "metrics" })
  return data
}

export const getRevenueData = async (filters: ReportsFiltersValues) => {
  const { data } = await api.get<RevenueData[]>("/reports/revenue", { params: filters, cancelKey: "revenue" })
  return data
}

export const getStatusDistribution = async (filters: ReportsFiltersValues) => {
  const { data } = await api.get<StatusDistribution[]>("/reports/status", { params: filters, cancelKey: "status" })
  return data
}

export const getOverdueClients = async (filters: ReportsFiltersValues) => {
  const { data } = await api.get<OverdueClient[]>("/reports/overdue", { params: filters, cancelKey: "overdue" })
  return data
}
