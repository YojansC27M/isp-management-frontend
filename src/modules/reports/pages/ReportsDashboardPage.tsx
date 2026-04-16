import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import MetricsCard from "../components/MetricsCard"
import OverdueClientsTable from "../components/OverdueClientsTable"
import ReportsFilters from "../components/ReportsFilters"
import RevenueChart from "../components/RevenueChart"
import StatusChart from "../components/StatusChart"
import { getOverdueClients, getReportMetrics, getRevenueData, getStatusDistribution } from "../services/reportsApi"
import type { OverdueClient, ReportMetrics, ReportsFiltersValues, RevenueData, StatusDistribution } from "../types/report"

const initialFilters: ReportsFiltersValues = {
  dateFrom: "",
  dateTo: "",
  zone: "",
  plan: "",
}

const ReportsDashboardPage = () => {
  const { t } = useI18n()
  const [filters, setFilters] = useState<ReportsFiltersValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<ReportsFiltersValues>(initialFilters)
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [statusData, setStatusData] = useState<StatusDistribution[]>([])
  const [overdueClients, setOverdueClients] = useState<OverdueClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadReports = useCallback(
    async (activeFilters: ReportsFiltersValues) => {
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
        setError(getErrorMessage(err, t("reports.loadErrorDefault")))
      } finally {
        setLoading(false)
      }
    },
    [t]
  )

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
      { label: t("reports.metrics.totalRevenue"), value: `$${metrics.totalRevenue.toFixed(2)}` },
      { label: t("reports.metrics.totalPaid"), value: `$${metrics.totalPaid.toFixed(2)}` },
      { label: t("reports.metrics.totalPending"), value: `$${metrics.totalPending.toFixed(2)}` },
      { label: t("reports.metrics.totalOverdue"), value: `$${metrics.totalOverdue.toFixed(2)}` },
    ]
  }, [metrics, t])

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t("reports.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("reports.description")}</p>
      </header>

      <ReportsFilters values={filters} onChange={setFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading ? (
        <StateMessage variant="loading" title={t("reports.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("reports.loadErrorTitle")} description={error} />
      ) : !metrics ? (
        <StateMessage variant="empty" title={t("reports.emptyTitle")} />
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
            <h3 className="text-sm font-semibold text-foreground">{t("reports.overdueClients.title")}</h3>
            <OverdueClientsTable clients={overdueClients} />
          </section>
        </>
      )}
    </div>
  )
}

export default ReportsDashboardPage
