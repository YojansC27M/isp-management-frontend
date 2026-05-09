import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { getRouterMetrics, getRouters } from "@/modules/monitoring/services/monitoringApi"
import type { Router, RouterMetrics } from "@/modules/monitoring/types/monitoring"

type AlertSeverity = "critical" | "warning"

interface NocAlert {
  routerId: string
  routerName: string
  message: string
  severity: AlertSeverity
}

const NocPage = () => {
  const navigate = useNavigate()
  const canSeeRouters = useCan("routers.read")
  const canSeeMonitoring = useCan("monitoring.read")
  const [routers, setRouters] = useState<Router[]>([])
  const [metricsByRouter, setMetricsByRouter] = useState<Record<string, RouterMetrics>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadNocSnapshot = useCallback(async () => {
    if (!canSeeMonitoring && !canSeeRouters) return
    setLoading(true)
    setError("")
    try {
      const routersData = await getRouters()
      setRouters(routersData)

      if (!canSeeMonitoring || routersData.length === 0) {
        setMetricsByRouter({})
        return
      }

      const metricsEntries = await Promise.all(
        routersData.map(async (router) => {
          try {
            const metrics = await getRouterMetrics(router.id)
            return [router.id, metrics] as const
          } catch {
            return [router.id, null] as const
          }
        }),
      )

      const nextMetrics: Record<string, RouterMetrics> = {}
      for (const [routerId, metrics] of metricsEntries) {
        if (metrics) nextMetrics[routerId] = metrics
      }
      setMetricsByRouter(nextMetrics)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar el tablero NOC."))
    } finally {
      setLoading(false)
    }
  }, [canSeeMonitoring, canSeeRouters])

  useEffect(() => {
    void loadNocSnapshot()
  }, [loadNocSnapshot])

  const summary = useMemo(() => {
    const total = routers.length
    const online = routers.filter((router) => router.status === "online").length
    const offline = total - online
    const degraded = Object.values(metricsByRouter).filter((metric) => metric.degraded).length
    return { total, online, offline, degraded }
  }, [routers, metricsByRouter])

  const alerts = useMemo<NocAlert[]>(() => {
    const next: NocAlert[] = []
    for (const router of routers) {
      if (router.status === "offline") {
        next.push({
          routerId: router.id,
          routerName: router.name,
          message: "Router sin conectividad",
          severity: "critical",
        })
      }

      const metrics = metricsByRouter[router.id]
      if (!metrics) continue

      if (metrics.cpuUsage >= 90 || metrics.ramUsage >= 90) {
        next.push({
          routerId: router.id,
          routerName: router.name,
          message: `Consumo alto CPU/RAM (${metrics.cpuUsage}%/${metrics.ramUsage}%)`,
          severity: "critical",
        })
        continue
      }

      if (metrics.cpuUsage >= 75 || metrics.ramUsage >= 75) {
        next.push({
          routerId: router.id,
          routerName: router.name,
          message: `Consumo elevado CPU/RAM (${metrics.cpuUsage}%/${metrics.ramUsage}%)`,
          severity: "warning",
        })
      }
    }

    return next
      .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1))
      .slice(0, 8)
  }, [metricsByRouter, routers])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="NOC"
        description="Centro de operaciones de red para administrar infraestructura y monitoreo tecnico."
        actions={
          <Button variant="outline" onClick={() => void loadNocSnapshot()} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar tablero"}
          </Button>
        }
      />

      {error ? <StateMessage variant="error" title="Error al cargar tablero NOC" description={error} /> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Routers totales" value={String(summary.total)} />
        <KpiCard label="Routers online" value={String(summary.online)} />
        <KpiCard label="Routers offline" value={String(summary.offline)} />
        <KpiCard label="Routers degradados" value={String(summary.degraded)} />
      </section>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Alertas operativas</CardTitle>
          <CardDescription>Eventos priorizados para atencion inmediata del equipo NOC.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && routers.length === 0 ? (
            <StateMessage variant="loading" title="Cargando alertas..." />
          ) : alerts.length === 0 ? (
            <StateMessage variant="empty" title="Sin alertas activas en este momento." />
          ) : (
            <div className="grid gap-3">
              {alerts.map((alert) => (
                <article
                  key={`${alert.routerId}-${alert.message}`}
                  className={`rounded-xl border px-4 py-3 ${
                    alert.severity === "critical"
                      ? "border-rose-200 bg-rose-50/70"
                      : "border-amber-200 bg-amber-50/70"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{alert.routerName}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Routers</CardTitle>
            <CardDescription>Inventario, estado operativo, pruebas de conexion y backups.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/routers")} disabled={!canSeeRouters}>
              Abrir routers
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Monitoreo</CardTitle>
            <CardDescription>Salud de red, uso de recursos y estado de interfaces.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/monitoring")} disabled={!canSeeMonitoring}>
              Abrir monitoreo
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default NocPage
