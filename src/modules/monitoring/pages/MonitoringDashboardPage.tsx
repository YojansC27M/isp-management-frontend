import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
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

const MonitoringDashboardPage = () => {
  const { t } = useI18n()
  const [routers, setRouters] = useState<Router[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<RouterMetrics | null>(null)
  const [interfaces, setInterfaces] = useState<InterfaceStatus[]>([])
  const [loadingRouters, setLoadingRouters] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [routersError, setRoutersError] = useState("")
  const [detailsError, setDetailsError] = useState("")

  const loadRouters = useCallback(async () => {
    setLoadingRouters(true)
    setRoutersError("")
    try {
      const data = await getRouters()
      setRouters(data)
      if (data.length > 0 && !selectedRouterId) {
        setSelectedRouterId(data[0].id)
      }
    } catch (err) {
      setRoutersError(getErrorMessage(err, t("monitoring.loadRoutersErrorDefault")))
    } finally {
      setLoadingRouters(false)
    }
  }, [selectedRouterId, t])

  const loadDetails = useCallback(
    async (routerId: string) => {
      setLoadingDetails(true)
      setDetailsError("")
      try {
        const [metricsData, interfacesData] = await Promise.all([getRouterMetrics(routerId), getRouterInterfaces(routerId)])
        setMetrics(metricsData)
        setInterfaces(interfacesData)
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

  const selectedRouter = useMemo(() => routers.find((router) => router.id === selectedRouterId) ?? null, [routers, selectedRouterId])

  const showThresholdAlert = metrics ? metrics.cpuUsage >= CPU_THRESHOLD || metrics.ramUsage >= RAM_THRESHOLD : false

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t("monitoring.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("monitoring.description")}</p>
      </header>

      {loadingRouters ? (
        <StateMessage variant="loading" title={t("monitoring.loadingRouters")} />
      ) : routersError ? (
        <StateMessage variant="error" title={t("monitoring.loadRoutersErrorTitle")} description={routersError} />
      ) : routers.length === 0 ? (
        <StateMessage variant="empty" title={t("monitoring.emptyRouters")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {routers.map((router) => (
            <RouterCard key={router.id} router={router} selected={router.id === selectedRouterId} onSelect={setSelectedRouterId} />
          ))}
        </div>
      )}

      {selectedRouter && (
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-foreground">{selectedRouter.name}</h2>
          {loadingDetails ? (
            <StateMessage variant="loading" title={t("monitoring.loadingMetrics")} />
          ) : detailsError ? (
            <StateMessage variant="error" title={t("monitoring.loadMetricsErrorTitle")} description={detailsError} />
          ) : metrics ? (
            <>
              {showThresholdAlert && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {t("monitoring.thresholdAlert")}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard label={t("monitoring.stats.cpu")} value={`${metrics.cpuUsage}%`} />
                <StatsCard label={t("monitoring.stats.ram")} value={`${metrics.ramUsage}%`} />
                <StatsCard label={t("monitoring.stats.uptime")} value={metrics.uptime} />
                <StatsCard label={t("monitoring.stats.traffic")} value={metrics.totalTraffic} />
              </div>
              <TrafficChart />
              {interfaces.length === 0 ? (
                <StateMessage variant="empty" title={t("monitoring.emptyInterfaces")} />
              ) : (
                <InterfacesTable interfaces={interfaces} />
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
