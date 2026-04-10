import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
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
      setRoutersError(getErrorMessage(err, "No fue posible cargar los routers."))
    } finally {
      setLoadingRouters(false)
    }
  }, [selectedRouterId])

  const loadDetails = useCallback(async (routerId: string) => {
    setLoadingDetails(true)
    setDetailsError("")
    try {
      const [metricsData, interfacesData] = await Promise.all([getRouterMetrics(routerId), getRouterInterfaces(routerId)])
      setMetrics(metricsData)
      setInterfaces(interfacesData)
    } catch (err) {
      setDetailsError(getErrorMessage(err, "No fue posible cargar las metricas del router."))
    } finally {
      setLoadingDetails(false)
    }
  }, [])

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
        <h1 className="text-2xl font-semibold text-foreground">Monitoreo de red</h1>
        <p className="mt-1 text-sm text-muted-foreground">Supervisa routers, interfaces y consumo en tiempo real.</p>
      </header>

      {loadingRouters ? (
        <StateMessage variant="loading" title="Cargando routers..." />
      ) : routersError ? (
        <StateMessage variant="error" title="Error al cargar routers" description={routersError} />
      ) : routers.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron routers." />
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
            <StateMessage variant="loading" title="Cargando metricas del router..." />
          ) : detailsError ? (
            <StateMessage variant="error" title="Error en metricas del router" description={detailsError} />
          ) : metrics ? (
            <>
              {showThresholdAlert && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Alerta: consumo alto de recursos detectado en este router.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard label="Uso de CPU" value={`${metrics.cpuUsage}%`} />
                <StatsCard label="Uso de RAM" value={`${metrics.ramUsage}%`} />
                <StatsCard label="Tiempo en linea" value={metrics.uptime} />
                <StatsCard label="Trafico total" value={metrics.totalTraffic} />
              </div>
              <TrafficChart />
              {interfaces.length === 0 ? (
                <StateMessage variant="empty" title="No se encontraron interfaces." />
              ) : (
                <InterfacesTable interfaces={interfaces} />
              )}
            </>
          ) : (
            <StateMessage variant="empty" title="No hay metricas disponibles." />
          )}
        </section>
      )}
    </div>
  )
}

export default MonitoringDashboardPage
