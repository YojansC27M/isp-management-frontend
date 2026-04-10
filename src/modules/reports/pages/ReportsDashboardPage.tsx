import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import MetricsCard from "../components/MetricsCard"
import OverdueClientsTable from "../components/OverdueClientsTable"
import ReportsFilters from "../components/ReportsFilters"
import RevenueChart from "../components/RevenueChart"
import StatusChart from "../components/StatusChart"
import { getOverdueClients, getReportMetrics, getRevenueData, getStatusDistribution } from "../services/reportsApi"
import type { OverdueClient, ReportMetrics, ReportsFiltersValues, RevenueData, StatusDistribution } from "../types/report"
import { getErrorMessage } from "@/lib/errors"

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
  const [error, setError] = useState("")

  const loadReports = useCallback(async (activeFilters: ReportsFiltersValues) => {
    setLoading(true)
    setError("")
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
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar los reportes."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports(appliedFilters)
  }, [appliedFilters, loadReports])

  const handleApplyFilters = () => setAppliedFilters(filters)

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
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Reportes de facturación</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analiza ingresos, cartera y comportamiento de cobro.</p>
      </header>

      <ReportsFilters values={filters} onChange={setFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading ? (
        <StateMessage variant="loading" title="Cargando reportes..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar reportes" description={error} />
      ) : !metrics ? (
        <StateMessage variant="empty" title="No hay datos de reportes." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricsCards.map((card) => (
              <MetricsCard key={card.label} label={card.label} value={card.value} />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <RevenueChart data={revenueData} />
            <StatusChart data={statusData} />
          </div>
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-foreground">Clientes vencidos</h3>
            <OverdueClientsTable clients={overdueClients} />
          </section>
        </>
      )}
    </div>
  )
}

export default ReportsDashboardPage
