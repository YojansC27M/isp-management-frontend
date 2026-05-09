import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, AlertTriangle, ArrowRight, Clock3, Gauge, Network, Router as RouterIcon, Wifi } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import InterfacesTable from "../components/InterfacesTable"
import RouterCard from "../components/RouterCard"
import StatsCard from "../components/StatsCard"
import TrafficChart from "../components/TrafficChart"
import { getRouterInterfaces, getRouterMetrics, getRouters } from "../services/monitoringApi"
import type { InterfaceStatus, Router, RouterMetrics } from "../types/monitoring"

const CPU_THRESHOLD = 85
const RAM_THRESHOLD = 85

interface MonitoringAlert {
  id: string
  tone: "high" | "medium" | "low"
  title: string
  description: string
}

const alertToneClasses: Record<MonitoringAlert["tone"], string> = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const MonitoringDashboardPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [routers, setRouters] = useState<Router[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<RouterMetrics | null>(null)
  const [interfaces, setInterfaces] = useState<InterfaceStatus[]>([])
  const [loadingRouters, setLoadingRouters] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [routersError, setRoutersError] = useState("")
  const [detailsError, setDetailsError] = useState("")
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const loadRouters = useCallback(async () => {
    setLoadingRouters(true)
    setRoutersError("")
    try {
      const data = await getRouters()
      setRouters(data)
      setSelectedRouterId((current) => current ?? data[0]?.id ?? null)
    } catch (err) {
      setRoutersError(getErrorMessage(err, t("monitoring.loadRoutersErrorDefault")))
    } finally {
      setLoadingRouters(false)
    }
  }, [t])

  const loadDetails = useCallback(
    async (routerId: string) => {
      setLoadingDetails(true)
      setDetailsError("")
      try {
        const [metricsData, interfacesData] = await Promise.all([getRouterMetrics(routerId), getRouterInterfaces(routerId)])
        setMetrics(metricsData)
        setInterfaces(interfacesData)
        setLastSyncAt(new Date().toISOString())
      } catch (err) {
        setDetailsError(getErrorMessage(err, t("monitoring.loadMetricsErrorDefault")))
      } finally {
        setLoadingDetails(false)
      }
    },
    [t]
  )

  useEffect(() => {
    loadRouters()
  }, [loadRouters])

  useEffect(() => {
    if (!selectedRouterId) return
    loadDetails(selectedRouterId)
    const interval = setInterval(() => {
      loadDetails(selectedRouterId)
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedRouterId, loadDetails])

  const selectedRouter = useMemo(
    () => routers.find((router) => router.id === selectedRouterId) ?? null,
    [routers, selectedRouterId]
  )

  const showThresholdAlert = metrics ? metrics.cpuUsage >= CPU_THRESHOLD || metrics.ramUsage >= RAM_THRESHOLD : false
  const onlineRouters = routers.filter((router) => router.status === "online").length
  const offlineRouters = routers.filter((router) => router.status === "offline").length
  const activeInterfaces = interfaces.filter((item) => item.status === "up").length
  const downInterfaces = interfaces.filter((item) => item.status === "down").length
  const totalThroughput = metrics?.totalTraffic ?? "-"

  const trafficTrend = useMemo(() => {
    const available = interfaces
      .filter((item) => item.name !== "connection-unavailable")
      .map((item) => ({
        label: item.name,
        rxMbps: item.rxMbps ?? 0,
        txMbps: item.txMbps ?? 0,
      }))
      .sort((a, b) => b.rxMbps + b.txMbps - (a.rxMbps + a.txMbps))
      .slice(0, 6)

    const maxObserved = Math.max(1, ...available.map((item) => Math.max(item.rxMbps, item.txMbps)))

    return available.map((item) => ({
      label: item.label,
      rx: clamp(Math.round((item.rxMbps / maxObserved) * 100), 4, 100),
      tx: clamp(Math.round((item.txMbps / maxObserved) * 100), 4, 100),
      rxLabel: `${item.rxMbps.toFixed(2)} Mbps`,
      txLabel: `${item.txMbps.toFixed(2)} Mbps`,
    }))
  }, [interfaces])

  const alerts = useMemo<MonitoringAlert[]>(() => {
    if (!selectedRouter) return []

    const nextAlerts: MonitoringAlert[] = []

    if (selectedRouter.status === "offline") {
      nextAlerts.push({
        id: "router-offline",
        tone: "high",
        title: t("monitoring.alerts.routerOfflineTitle"),
        description: t("monitoring.alerts.routerOfflineDesc"),
      })
    }

    if (metrics && metrics.cpuUsage >= CPU_THRESHOLD) {
      nextAlerts.push({
        id: "cpu-high",
        tone: "medium",
        title: t("monitoring.alerts.cpuHighTitle"),
        description: t("monitoring.alerts.cpuHighDesc", { value: metrics.cpuUsage }),
      })
    }

    if (metrics && metrics.ramUsage >= RAM_THRESHOLD) {
      nextAlerts.push({
        id: "ram-high",
        tone: "medium",
        title: t("monitoring.alerts.ramHighTitle"),
        description: t("monitoring.alerts.ramHighDesc", { value: metrics.ramUsage }),
      })
    }

    if (downInterfaces > 0) {
      nextAlerts.push({
        id: "interfaces-down",
        tone: "low",
        title: t("monitoring.alerts.interfacesDownTitle"),
        description: t("monitoring.alerts.interfacesDownDesc", { count: downInterfaces }),
      })
    }

    if (nextAlerts.length === 0) {
      nextAlerts.push({
        id: "all-clear",
        tone: "low",
        title: t("monitoring.alerts.allClearTitle"),
        description: t("monitoring.alerts.allClearDesc"),
      })
    }

    return nextAlerts
  }, [downInterfaces, metrics, selectedRouter, t])

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(115deg,#07111f,#0f3b5f_48%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">{t("monitoring.heroTag")}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("monitoring.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/90">{t("monitoring.description")}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button className="bg-card text-foreground hover:bg-muted" onClick={() => selectedRouterId && loadDetails(selectedRouterId)}>
                {t("monitoring.refresh")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                onClick={() => navigate("/routers")}
              >
                {t("monitoring.openRouters")}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cyan-100">{t("monitoring.summary.title")}</p>
                <p className="mt-1 text-xs text-slate-100/80">
                  {t("monitoring.lastSync")}:{" "}
                  {lastSyncAt
                    ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSyncAt))
                    : "-"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  selectedRouter?.status === "online" ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {selectedRouter ? selectedRouter.name : t("monitoring.noRouterSelected")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("monitoring.summary.onlineRouters")}</p>
                <p className="text-lg font-semibold">{onlineRouters}</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("monitoring.summary.offlineRouters")}</p>
                <p className="text-lg font-semibold">{offlineRouters}</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("monitoring.summary.alertsActive")}</p>
                <p className="text-lg font-semibold">{alerts.length}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { icon: RouterIcon, label: t("monitoring.summary.selectedRouter"), value: selectedRouter?.name ?? "-" },
                { icon: Gauge, label: t("monitoring.summary.totalThroughput"), value: totalThroughput },
                { icon: Network, label: t("monitoring.summary.activeInterfaces"), value: String(activeInterfaces) },
                { icon: AlertTriangle, label: t("monitoring.summary.offlineInterfaces"), value: String(downInterfaces) },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-cyan-100/85">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("monitoring.summary.onlineRouters")} value={String(onlineRouters)} />
        <KpiCard label={t("monitoring.summary.offlineRouters")} value={String(offlineRouters)} />
        <KpiCard label={t("monitoring.summary.activeInterfaces")} value={String(activeInterfaces)} />
        <KpiCard label={t("monitoring.summary.throughput")} value={totalThroughput} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t("monitoring.routerList.title")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("monitoring.routerList.subtitle")}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5" />
              {routers.length} {t("monitoring.routerList.countSuffix")}
            </span>
          </CardHeader>
          <CardContent>
            {loadingRouters ? (
              <StateMessage variant="loading" title={t("monitoring.loadingRouters")} />
            ) : routersError ? (
              <StateMessage variant="error" title={t("monitoring.loadRoutersErrorTitle")} description={routersError} />
            ) : routers.length === 0 ? (
              <StateMessage variant="empty" title={t("monitoring.emptyRouters")} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {routers.map((router) => (
                  <RouterCard key={router.id} router={router} selected={router.id === selectedRouterId} onSelect={setSelectedRouterId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("monitoring.alerts.title")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("monitoring.alerts.description")}</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {alerts.map((alert) => (
              <article key={alert.id} className={`rounded-2xl border p-3 ${alertToneClasses[alert.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                    <p className="mt-1 text-xs opacity-90">{alert.description}</p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      {selectedRouter && (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{selectedRouter.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedRouter.ip} · {selectedRouter.location} ·{" "}
                {selectedRouter.status === "online" ? t("routers.status.online") : t("routers.status.offline")}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/routers/${selectedRouter.id}`)}>
              {t("monitoring.openDetail")}
            </Button>
          </div>

          {loadingDetails ? (
            <StateMessage variant="loading" title={t("monitoring.loadingMetrics")} />
          ) : detailsError ? (
            <StateMessage variant="error" title={t("monitoring.loadMetricsErrorTitle")} description={detailsError} />
          ) : metrics ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{t("monitoring.health.title")}</CardTitle>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        selectedRouter.status === "online"
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                      }`}
                    >
                      {selectedRouter.status === "online" ? t("routers.status.online") : t("routers.status.offline")}
                    </span>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {showThresholdAlert ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        {t("monitoring.thresholdAlert")}
                      </div>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <StatsCard label={t("monitoring.stats.cpu")} value={`${metrics.cpuUsage}%`} />
                      <StatsCard label={t("monitoring.stats.ram")} value={`${metrics.ramUsage}%`} />
                      <StatsCard label={t("monitoring.stats.uptime")} value={metrics.uptime} />
                      <StatsCard label={t("monitoring.stats.traffic")} value={metrics.totalTraffic} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KpiCard label={t("monitoring.summary.interfacesUp")} value={String(activeInterfaces)} />
                      <KpiCard label={t("monitoring.summary.interfacesDown")} value={String(downInterfaces)} />
                      <KpiCard label={t("monitoring.summary.routerLocation")} value={selectedRouter.location} />
                      <KpiCard
                        label={t("monitoring.summary.lastSync")}
                        value={
                          lastSyncAt
                            ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSyncAt))
                            : "-"
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>{t("monitoring.traffic.title")}</CardTitle>
                    <p className="text-xs text-muted-foreground">{t("monitoring.traffic.description")}</p>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {trafficTrend.length === 0 ? <StateMessage variant="empty" title={t("monitoring.emptyInterfaces")} /> : <TrafficChart points={trafficTrend} />}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("monitoring.traffic.rx")}</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{metrics.rxTraffic}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("monitoring.traffic.tx")}</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{metrics.txTraffic}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>{t("monitoring.timing.title")}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t("monitoring.timing.description")}</p>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    {
                      icon: Clock3,
                      label: t("monitoring.timing.lastSync"),
                      value: lastSyncAt
                        ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(lastSyncAt))
                        : "-",
                    },
                    {
                      icon: Activity,
                      label: t("monitoring.timing.routerStatus"),
                      value: selectedRouter.status === "online" ? t("routers.status.online") : t("routers.status.offline"),
                    },
                    { icon: Gauge, label: t("monitoring.timing.cpuTrend"), value: `${metrics.cpuUsage}%` },
                    { icon: Network, label: t("monitoring.timing.interfaces"), value: `${activeInterfaces}/${interfaces.length || 0}` },
                    { icon: RouterIcon, label: t("monitoring.timing.router"), value: selectedRouter.name },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/20 p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {interfaces.length === 0 ? (
                <StateMessage variant="empty" title={t("monitoring.emptyInterfaces")} />
              ) : (
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>{t("monitoring.interfaces.title")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InterfacesTable interfaces={interfaces} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <StateMessage variant="empty" title={t("monitoring.emptyMetrics")} />
          )}
        </section>
      )}
    </div>
  )
}

export default MonitoringDashboardPage
