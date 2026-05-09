import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, ArrowUpRight, CalendarClock, CreditCard, MapPin, RefreshCw, Ticket, Users } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserPermissions, hasAnyPermission } from "@/auth/permissions"
import type { Permission } from "@/auth/types"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { getDashboardOverview } from "@/modules/dashboard/services/dashboardApi"
import type { DashboardOverview } from "@/modules/dashboard/types/dashboard"
import { useAuthStore } from "@/store/authStore"

const quickActions = [
  { labelKey: "dashboard.action.createClient", href: "/clients/new", icon: Users, requiredPermissions: ["clients.write"] as Permission[] },
  { labelKey: "dashboard.action.createTicket", href: "/tickets/new", icon: Ticket, requiredPermissions: ["tickets.write"] as Permission[] },
  { labelKey: "dashboard.action.registerPayment", href: "/payments/new", icon: CreditCard, requiredPermissions: ["payments.manual.write"] as Permission[] },
  { labelKey: "dashboard.action.scheduleVisit", href: "/visits/new", icon: CalendarClock, requiredPermissions: ["visits.write"] as Permission[] },
  { labelKey: "dashboard.action.openClients", href: "/clients", icon: MapPin, requiredPermissions: ["clients.read"] as Permission[] },
  { labelKey: "dashboard.action.openReports", href: "/reports", icon: ArrowUpRight, requiredPermissions: ["reports.read"] as Permission[] },
]

const severityTone = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
} as const

const operationStatusTone = {
  online: "bg-emerald-400/20 text-emerald-100",
  degraded: "bg-amber-400/20 text-amber-100",
  critical: "bg-rose-400/20 text-rose-100",
} as const

const DEFAULT_DASHBOARD_POLLING_MS = 60_000
const MIN_DASHBOARD_POLLING_MS = 5_000

const resolveDashboardPollingMs = () => {
  const parsed = Number(import.meta.env.VITE_DASHBOARD_POLLING_MS)
  if (!Number.isFinite(parsed)) return DEFAULT_DASHBOARD_POLLING_MS
  return Math.max(MIN_DASHBOARD_POLLING_MS, Math.trunc(parsed))
}

const DASHBOARD_POLLING_MS = resolveDashboardPollingMs()

const formatCurrency = (value: number, locale: string, currency: string) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)
  }
}

const DashboardPage = () => {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const storePermissions = useAuthStore((state) => state.permissions)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [initialLoading, setInitialLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const effectivePermissions = storePermissions.length > 0 ? storePermissions : getUserPermissions(user)
  const activeLocale = locale === "es" ? "es-CO" : "en-US"
  const activeCurrency = overview?.formatting.currency?.trim()?.toUpperCase() || (locale === "es" ? "COP" : "USD")

  const loadOverview = useCallback(async (mode: "initial" | "background" = "initial") => {
    if (mode === "initial") setInitialLoading(true)
    else setRefreshing(true)
    if (mode === "initial") setError("")
    try {
      const data = await getDashboardOverview()
      setOverview(data)
    } catch (err) {
      if (mode === "initial") {
        setError(getErrorMessage(err, t("dashboard.loadErrorDefault")))
      }
    } finally {
      if (mode === "initial") setInitialLoading(false)
      else setRefreshing(false)
    }
  }, [t])

  useEffect(() => {
    void loadOverview("initial")
  }, [loadOverview])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadOverview("background")
    }, DASHBOARD_POLLING_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [loadOverview])

  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(activeLocale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: overview?.formatting.timezone || undefined,
      }).format(overview?.generatedAt ? new Date(overview.generatedAt) : new Date()),
    [activeLocale, overview?.formatting.timezone, overview?.generatedAt],
  )

  if (initialLoading) return <StateMessage variant="loading" title={t("dashboard.loading")} />
  if (error && !overview) return <StateMessage variant="error" title={t("dashboard.loadErrorTitle")} description={error} />
  if (!overview) return <StateMessage variant="empty" title={t("dashboard.empty")} />

  const performanceBlocks = [
    { label: t("dashboard.metric.activeClients"), value: overview.summary.activeClients.toLocaleString("es-CO") },
    { label: t("dashboard.metric.openTickets"), value: String(overview.summary.openTickets) },
    { label: t("dashboard.metric.visitsToday"), value: String(overview.summary.visitsToday) },
    { label: t("dashboard.metric.overdueInvoices"), value: String(overview.summary.overdueInvoices) },
  ]

  const operationalMetrics = [
    { label: t("dashboard.metric.activeClients"), value: overview.summary.activeClients.toLocaleString("es-CO") },
    { label: t("dashboard.metric.openTickets"), value: String(overview.summary.openTickets) },
    { label: t("dashboard.metric.visitsToday"), value: String(overview.summary.visitsToday) },
    { label: t("dashboard.metric.avgLatency"), value: overview.summary.avgLatencyMs != null ? `${overview.summary.avgLatencyMs} ms` : "--" },
    {
      label: t("dashboard.metric.monthRevenue"),
      value: formatCurrency(overview.summary.monthRevenue, activeLocale, activeCurrency),
    },
    { label: t("dashboard.metric.overdueInvoices"), value: String(overview.summary.overdueInvoices) },
  ]

  const reportSummary = [
    { label: t("reports.metrics.totalRevenue"), value: formatCurrency(overview.reporting.totalRevenue, activeLocale, activeCurrency) },
    { label: t("reports.metrics.totalOverdue"), value: formatCurrency(overview.reporting.totalOverdue, activeLocale, activeCurrency) },
    { label: t("reports.metrics.totalPaid"), value: formatCurrency(overview.reporting.totalPaid, activeLocale, activeCurrency) },
    { label: t("reports.metrics.totalPending"), value: formatCurrency(overview.reporting.totalPending, activeLocale, activeCurrency) },
  ]
  const visibleQuickActions = quickActions.filter((action) =>
    hasAnyPermission(effectivePermissions, action.requiredPermissions),
  )

  const statusLabel =
    overview.operationStatus === "online"
      ? t("dashboard.online")
      : overview.operationStatus === "degraded"
        ? t("dashboard.degraded")
        : t("dashboard.critical")

  const generatedAtLabel = new Intl.DateTimeFormat(activeLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: overview.formatting.timezone || undefined,
  }).format(new Date(overview.generatedAt))

  return (
    <div className="space-y-6">
      <section className="animate-fade-up relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(115deg,#09111f,#153d6d_45%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">{t("dashboard.heroTag")}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("dashboard.heroTitle")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/90">{t("dashboard.heroDescription")}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button className="bg-card text-foreground hover:bg-muted" onClick={() => navigate("/monitoring")}>
                {t("dashboard.goMonitoring")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                onClick={() => void loadOverview("background")}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? t("common.loading") : t("common.refresh")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                onClick={() => navigate("/tickets")}
              >
                {t("dashboard.reviewTickets")}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cyan-100">{t("dashboard.operationStatus")}</p>
                <p className="mt-1 text-xs text-slate-100/80 capitalize">{currentDateLabel}</p>
                <p className="mt-1 text-xs text-slate-100/70">
                  {t("dashboard.lastSync")}: {generatedAtLabel}
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${operationStatusTone[overview.operationStatus]}`}>
                <span className="h-2 w-2 rounded-full bg-current animate-soft-pulse" />
                {statusLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("dashboard.routers")}</p>
                <p className="text-lg font-semibold">{overview.summary.routersTotal}</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("dashboard.uptime")}</p>
                <p className="text-lg font-semibold">{overview.summary.uptimePercent}%</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("dashboard.alerts")}</p>
                <p className="text-lg font-semibold">{overview.summary.alertsCount}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {performanceBlocks.map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/85">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {operationalMetrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>
            <span className="text-xs text-muted-foreground">{t("dashboard.quickActionsDescription")}</span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleQuickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => navigate(action.href)}
                    className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t(action.labelKey)}</p>
                        <p className="text-xs text-muted-foreground">{action.href}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard.pendingAlerts")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.incidents.length === 0 ? (
              <StateMessage
                variant="empty"
                title={t("dashboard.noPendingAlerts")}
                description={t("dashboard.noPendingAlertsDescription")}
              />
            ) : (
              overview.incidents.map((incident) => (
                <article
                  key={incident.id}
                  className="rounded-2xl border border-border bg-muted/35 p-3 transition hover:bg-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{incident.title}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityTone[incident.severity]}`}>
                      {t(`dashboard.severity.${incident.severity}`)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{incident.detail}</p>
                  {incident.href ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                      onClick={() => navigate(incident.href as string)}
                    >
                      {t("dashboard.openDetail")}
                    </button>
                  ) : null}
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-border bg-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.networkActivity")}</CardTitle>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {t("dashboard.latestPeaks")}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {overview.activityByHour.map((point) => (
                <div key={point.label} className="grid grid-cols-[65px_1fr_38px] items-center gap-3">
                  <span className="text-xs text-muted-foreground">{point.label}</span>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${point.usagePercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">{point.usagePercent}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{t("dashboard.action.openReports")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              {reportSummary.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/80 bg-muted/25 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => navigate("/reports")} className="w-full">
              {t("dashboard.action.openReports")}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
