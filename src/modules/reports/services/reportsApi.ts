import api from "@/api/axios"
import type {
  OperationsMetrics,
  OverdueClient,
  ReportMetrics,
  ReportsFiltersValues,
  RevenueData,
  StatusDistribution,
} from "../types/report"

const normalizeReportFilters = (filters: ReportsFiltersValues) => {
  const normalizedEntries = Object.entries(filters)
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([, value]) => value.length > 0)

  return Object.fromEntries(normalizedEntries)
}

export const getReportMetrics = async (filters: ReportsFiltersValues) => {
  const params = normalizeReportFilters(filters)
  const { data } = await api.get<ReportMetrics>("/reports/metrics", { params, cancelKey: "metrics" })
  return data
}

export const getRevenueData = async (filters: ReportsFiltersValues) => {
  const params = normalizeReportFilters(filters)
  const { data } = await api.get<RevenueData[]>("/reports/revenue", { params, cancelKey: "revenue" })
  return data
}

export const getStatusDistribution = async (filters: ReportsFiltersValues) => {
  const params = normalizeReportFilters(filters)
  const { data } = await api.get<StatusDistribution[]>("/reports/status", { params, cancelKey: "status" })
  return data
}

export const getOverdueClients = async (filters: ReportsFiltersValues) => {
  const params = normalizeReportFilters(filters)
  const { data } = await api.get<OverdueClient[]>("/reports/overdue", { params, cancelKey: "overdue" })
  return data
}

export const getOperationsMetrics = async (filters: ReportsFiltersValues) => {
  const params = normalizeReportFilters(filters)
  const { data } = await api.get<OperationsMetrics>("/reports/operations", { params, cancelKey: "operations" })
  return data
}

export const downloadReportExport = async (filters: ReportsFiltersValues, format: "csv" | "json" | "xlsx" | "pdf") => {
  const params = { ...normalizeReportFilters(filters), format }
  const { data } = await api.get<Blob>("/reports/export", {
    params,
    responseType: "blob",
  })
  return data
}
