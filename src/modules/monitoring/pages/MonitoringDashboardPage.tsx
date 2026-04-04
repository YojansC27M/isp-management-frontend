import { useCallback, useEffect, useMemo, useState } from "react"
import InterfacesTable from "../components/InterfacesTable"
import RouterCard from "../components/RouterCard"
import StatsCard from "../components/StatsCard"
import TrafficChart from "../components/TrafficChart"
import { getRouterInterfaces, getRouterMetrics, getRouters } from "../services/monitoringApi"
import type { InterfaceStatus, Router, RouterMetrics } from "../types/monitoring"

const MonitoringDashboardPage = () => {
  const [routers, setRouters] = useState<Router[]>([])
  const [selectedRouterId, setSelectedRouterId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<RouterMetrics | null>(null)
  const [interfaces, setInterfaces] = useState<InterfaceStatus[]>([])
  const [loadingRouters, setLoadingRouters] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const loadRouters = useCallback(async () => {
    setLoadingRouters(true)
    try {
      const data = await getRouters()
      setRouters(data)
      if (data.length > 0 && !selectedRouterId) {
        setSelectedRouterId(data[0].id)
      }
    } finally {
      setLoadingRouters(false)
    }
  }, [selectedRouterId])

  const loadDetails = useCallback(async (routerId: string) => {
    setLoadingDetails(true)
    try {
      const [metricsData, interfacesData] = await Promise.all([
        getRouterMetrics(routerId),
        getRouterInterfaces(routerId),
      ])
      setMetrics(metricsData)
      setInterfaces(interfacesData)
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
    }, 12000)
    return () => clearInterval(interval)
  }, [selectedRouterId, loadDetails])

  const selectedRouter = useMemo(
    () => routers.find((router) => router.id === selectedRouterId) ?? null,
    [routers, selectedRouterId],
  )

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <h1>Monitoreo de red</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Supervisa el estado de routers y tráfico.</p>
      </header>

      {loadingRouters ? (
        <p>Cargando routers...</p>
      ) : routers.length === 0 ? (
        <p>No se encontraron routers.</p>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {routers.map((router) => (
            <RouterCard
              key={router.id}
              router={router}
              selected={router.id === selectedRouterId}
              onSelect={setSelectedRouterId}
            />
          ))}
        </div>
      )}

      {selectedRouter && (
        <section style={{ display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0 }}>{selectedRouter.name}</h2>
          {loadingDetails ? (
            <p>Cargando métricas del router...</p>
          ) : metrics ? (
            <>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <StatsCard label="Uso de CPU" value={`${metrics.cpuUsage}%`} />
                <StatsCard label="Uso de RAM" value={`${metrics.ramUsage}%`} />
                <StatsCard label="Tiempo en línea" value={metrics.uptime} />
                <StatsCard label="Tráfico total" value={metrics.totalTraffic} />
              </div>
              <TrafficChart />
              {interfaces.length === 0 ? (
                <p>No se encontraron interfaces.</p>
              ) : (
                <InterfacesTable interfaces={interfaces} />
              )}
            </>
          ) : (
            <p>No hay métricas disponibles.</p>
          )}
        </section>
      )}
    </div>
  )
}

export default MonitoringDashboardPage
