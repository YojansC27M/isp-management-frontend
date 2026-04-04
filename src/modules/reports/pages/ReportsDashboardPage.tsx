import { useCallback, useEffect, useMemo, useState } from "react"
import MetricsCard from "../components/MetricsCard"
import OverdueClientsTable from "../components/OverdueClientsTable"
import ReportsFilters from "../components/ReportsFilters"
import RevenueChart from "../components/RevenueChart"
import StatusChart from "../components/StatusChart"
import {
  getOverdueClients,
  getReportMetrics,
  getRevenueData,
  getStatusDistribution,
} from "../services/reportsApi"
import type { OverdueClient, ReportMetrics, ReportsFiltersValues, RevenueData, StatusDistribution } from "../types/report"

const initialFilters: ReportsFiltersValues = {
  dateFrom: "",
  dateTo: "",
  zone: "",
  plan: "",
}

const ReportsDashboardPage = () => {
  const [filters, setFilters] = useState<ReportsFiltersValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<ReportsFiltersValues>(initialFilters)
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [statusData, setStatusData] = useState<StatusDistribution[]>([])
  const [overdueClients, setOverdueClients] = useState<OverdueClient[]>([])
  const [loading, setLoading] = useState(false)

  const loadReports = useCallback(async (activeFilters: ReportsFiltersValues) => {
    setLoading(true)
    try {
      const [metricsResult, revenueResult, statusResult, overdueResult] = await Promise.all([
        getReportMetrics(activeFilters),
        getRevenueData(activeFilters),
        getStatusDistribution(activeFilters),
        getOverdueClients(activeFilters),
      ])
      setMetrics(metricsResult)
      setRevenueData(revenueResult)
      setStatusData(statusResult)
      setOverdueClients(overdueResult)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports(appliedFilters)
  }, [appliedFilters, loadReports])

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const metricsCards = useMemo(() => {
    if (!metrics) return []
    return [
      { label: "Ingresos totales", value: `$${metrics.totalRevenue.toFixed(2)}` },
      { label: "Total pagado", value: `$${metrics.totalPaid.toFixed(2)}` },
      { label: "Total pendiente", value: `$${metrics.totalPending.toFixed(2)}` },
      { label: "Total vencido", value: `$${metrics.totalOverdue.toFixed(2)}` },
    ]
  }, [metrics])

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <h1>Reportes de facturación</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Analiza ingresos y cartera.</p>
      </header>

      <ReportsFilters values={filters} onChange={setFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading ? (
        <p>Cargando reportes...</p>
      ) : !metrics ? (
        <p>No hay datos de reportes.</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {metricsCards.map((card) => (
              <MetricsCard key={card.label} label={card.label} value={card.value} />
            ))}
          </div>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <RevenueChart data={revenueData} />
            <StatusChart data={statusData} />
          </div>
          <section style={{ display: "grid", gap: 8 }}>
            <h3 style={{ margin: 0 }}>Clientes vencidos</h3>
            <OverdueClientsTable clients={overdueClients} />
          </section>
        </>
      )}
    </div>
  )
}

export default ReportsDashboardPage
