import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import MetricsCard from "../components/MetricsCard"
import OverdueClientsTable from "../components/OverdueClientsTable"
import ReportsFilters from "../components/ReportsFilters"
import RevenueChart from "../components/RevenueChart"
import StatusChart from "../components/StatusChart"
import {
  downloadReportExport,
  getOperationsMetrics,
  getOverdueClients,
  getReportMetrics,
  getRevenueData,
  getStatusDistribution,
} from "../services/reportsApi"
import type {
  OperationsMetrics,
  OverdueClient,
  ReportMetrics,
  ReportsFiltersValues,
  RevenueData,
  StatusDistribution,
} from "../types/report"

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
  const [operationsMetrics, setOperationsMetrics] = useState<OperationsMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [statusData, setStatusData] = useState<StatusDistribution[]>([])
  const [overdueClients, setOverdueClients] = useState<OverdueClient[]>([])
  const [loading, setLoading] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<null | "csv" | "json" | "xlsx" | "pdf">(null)
  const [error, setError] = useState("")

  const loadReports = useCallback(
    async (activeFilters: ReportsFiltersValues) => {
      setLoading(true)
      setError("")
      try {
        const [metricsResult, revenueResult, statusResult, overdueResult, operationsResult] = await Promise.all([
          getReportMetrics(activeFilters),
          getRevenueData(activeFilters),
          getStatusDistribution(activeFilters),
          getOverdueClients(activeFilters),
          getOperationsMetrics(activeFilters),
        ])
        setMetrics(metricsResult)
        setRevenueData(revenueResult)
        setStatusData(statusResult)
        setOverdueClients(overdueResult)
        setOperationsMetrics(operationsResult)
      } catch (err) {
        setError(getErrorMessage(err, t("reports.loadErrorDefault")))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  useEffect(() => {
    loadReports(appliedFilters)
  }, [appliedFilters, loadReports])

  const handleApplyFilters = () => setAppliedFilters(filters)

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const downloadFile = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async (format: "csv" | "json" | "xlsx" | "pdf") => {
    const filename = `reports-summary.${format}`
    try {
      setExportingFormat(format)
      const blob = await downloadReportExport(appliedFilters, format)
      downloadFile(filename, blob)
    } catch (err) {
      setError(getErrorMessage(err, t("reports.loadErrorDefault")))
    } finally {
      setExportingFormat(null)
    }
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

  const executiveSummary = useMemo(() => {
    if (!metrics) return null
    const trend = revenueData.length > 1 ? revenueData[revenueData.length - 1].amount - revenueData[0].amount : 0
    return {
      collected: `$${metrics.totalPaid.toFixed(2)}`,
      receivable: `$${metrics.totalPending.toFixed(2)}`,
      overdueCount: overdueClients.length,
      revenueTrend: `${trend >= 0 ? "+" : ""}${trend.toFixed(2)}`,
    }
  }, [metrics, overdueClients.length, revenueData])

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("reports.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("reports.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={!metrics || exportingFormat !== null}>
            {t("reports.exportCsv")}
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")} disabled={!metrics || exportingFormat !== null}>
            {t("reports.exportJson")}
          </Button>
          <Button variant="outline" onClick={() => handleExport("xlsx")} disabled={!metrics || exportingFormat !== null}>
            {t("reports.exportXlsx")}
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!metrics || exportingFormat !== null}>
            {t("reports.exportPdf")}
          </Button>
        </div>
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
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("reports.summary.title")}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {appliedFilters.dateFrom || appliedFilters.dateTo
                  ? `${appliedFilters.dateFrom || "..."} - ${appliedFilters.dateTo || "..."}`
                  : t("reports.description")}
              </span>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label={t("reports.summary.collected")} value={executiveSummary?.collected ?? "N/A"} />
              <KpiCard label={t("reports.summary.receivable")} value={executiveSummary?.receivable ?? "N/A"} />
              <KpiCard label={t("reports.summary.overdueCount")} value={String(executiveSummary?.overdueCount ?? 0)} />
              <KpiCard label={t("reports.summary.revenueTrend")} value={executiveSummary?.revenueTrend ?? "N/A"} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>{t("reports.operations.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label={t("reports.operations.openTickets")} value={String(operationsMetrics?.openTickets ?? 0)} />
              <KpiCard
                label={t("reports.operations.inProgressTickets")}
                value={String(operationsMetrics?.inProgressTickets ?? 0)}
              />
              <KpiCard
                label={t("reports.operations.resolvedTickets")}
                value={String(operationsMetrics?.resolvedTickets ?? 0)}
              />
              <KpiCard
                label={t("reports.operations.scheduledVisits")}
                value={String(operationsMetrics?.scheduledVisits ?? 0)}
              />
              <KpiCard
                label={t("reports.operations.completedVisits")}
                value={String(operationsMetrics?.completedVisits ?? 0)}
              />
              <KpiCard
                label={t("reports.operations.pendingInstallations")}
                value={String(operationsMetrics?.pendingInstallations ?? 0)}
              />
              <KpiCard
                label={t("reports.operations.completedInstallations")}
                value={String(operationsMetrics?.completedInstallations ?? 0)}
              />
            </CardContent>
          </Card>

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
