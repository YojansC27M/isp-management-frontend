import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, Radio, ShieldCheck, Wifi } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KeyValueSummaryGrid from "@/components/shared/KeyValueSummaryGrid"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getRouterInstallations } from "@/modules/installations/services/installationsApi"
import RouterForm from "../components/RouterForm"
import RouterHealthCard from "../components/RouterHealthCard"
import {
  createRouterBackup,
  downloadRouterBackup,
  getRouterById,
  getRouterBackups,
  getRouterHealth,
  testRouterConnection,
  testRouterConnectionById,
  updateRouter,
} from "../services/routersApi"
import type { ManagedRouter, RouterBackup, RouterFormValues, RouterHealth } from "../types/router"
import type { Installation } from "@/modules/installations/types/installation"

const mapRouterToFormValues = (router: ManagedRouter): RouterFormValues => ({
  name: router.name,
  ip: router.ip,
  port: router.port,
  username: router.username,
  password: "",
  zone: router.zone,
  location: router.location,
  latitude: router.latitude,
  longitude: router.longitude,
})

const RouterDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const canEdit = useCan("routers.write")
  const [router, setRouter] = useState<ManagedRouter | null>(null)
  const [health, setHealth] = useState<RouterHealth | null>(null)
  const [backups, setBackups] = useState<RouterBackup[]>([])
  const [installations, setInstallations] = useState<Installation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const [routerData, healthData, backupsData, installationsData] = await Promise.all([
        getRouterById(id),
        getRouterHealth(id),
        getRouterBackups(id),
        getRouterInstallations(id),
      ])
      setRouter(routerData)
      setHealth(healthData)
      setBackups(backupsData)
      setInstallations(installationsData)
    } catch (err) {
      setError(getErrorMessage(err, t("routers.detail.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const initialValues = useMemo<RouterFormValues>(() => {
    if (!router) {
      return {
        name: "",
        ip: "",
        port: 80,
        username: "",
        password: "",
        zone: "",
        location: "",
        latitude: null,
        longitude: null,
      }
    }
    return mapRouterToFormValues(router)
  }, [router])

  const handleSubmit = async (values: RouterFormValues) => {
    if (!id) return
    try {
      const payload = values.password.trim() ? values : { ...values, password: router?.passwordMasked ?? "******" }
      await updateRouter(id, payload)
      notify({
        title: t("routers.detail.updatedTitle"),
        description: t("routers.detail.updatedDesc"),
        type: "success",
      })
      await loadData()
    } catch (err) {
      notify({
        title: t("routers.detail.updateErrorTitle"),
        description: getErrorMessage(err, t("routers.detail.updateErrorDesc")),
        type: "error",
      })
    }
  }

  const handleQuickConnectionTest = async () => {
    if (!id) return
    try {
      const result = await testRouterConnectionById(id)
      notify({
        title: result.success ? t("routers.detail.connectionSuccessTitle") : t("routers.detail.connectionFailTitle"),
        description: result.latencyMs != null ? `${result.message}. Latencia ${result.latencyMs} ms.` : result.message,
        type: result.success ? "success" : "error",
      })
      await loadData()
    } catch (err) {
      notify({
        title: t("routers.detail.connectionErrorTitle"),
        description: getErrorMessage(err, t("routers.detail.connectionErrorDesc")),
        type: "error",
      })
    }
  }

  const handleCreateBackup = async () => {
    if (!id) return
    try {
      const backup = await createRouterBackup(id)
      notify({
        title: "Backup generado",
        description: `Se creo ${backup.fileName}`,
        type: "success",
      })
      await loadData()
    } catch (err) {
      notify({
        title: "Error al crear backup",
        description: getErrorMessage(err, "No fue posible generar el backup del router."),
        type: "error",
      })
    }
  }

  const handleDownloadBackup = async (backup: RouterBackup) => {
    if (!id) return
    try {
      await downloadRouterBackup(id, backup.id, backup.fileName)
      notify({
        title: "Backup descargado",
        description: backup.fileName,
        type: "success",
      })
    } catch (err) {
      notify({
        title: "Error al descargar backup",
        description: getErrorMessage(err, "No fue posible descargar el backup."),
        type: "error",
      })
    }
  }

  const healthMetrics = [
    { label: t("monitoring.stats.cpu"), value: health ? `${health.cpuUsage}%` : "-" },
    { label: t("monitoring.stats.ram"), value: health ? `${health.ramUsage}%` : "-" },
    { label: t("monitoring.stats.uptime"), value: health?.uptime ?? "-" },
    { label: t("monitoring.stats.traffic"), value: health?.throughput ?? "-" },
  ]

  if (loading) return <StateMessage variant="loading" title={t("routers.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("routers.detail.loadErrorTitle")} description={error} />
  if (!router) return <StateMessage variant="empty" title={t("routers.detail.notFound")} />

  const statusTone = router.status === "online" ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
  const lastCheckedLabel = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
  }).format(new Date(router.lastCheckedAt))

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("routers.detail.title")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{router.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">
                {router.ip}:{router.port} - {router.location}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
                {router.status === "online" ? t("routers.status.online") : t("routers.status.offline")}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {router.zone}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {lastCheckedLabel}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px] lg:grid-cols-2">
            <Button className="bg-white text-slate-900 hover:bg-cyan-50" onClick={handleQuickConnectionTest}>
              <Wifi className="mr-2 h-4 w-4" />
              {t("routers.detail.testConnection")}
            </Button>
            <Button variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("/monitoring")}>
              <Radio className="mr-2 h-4 w-4" />
              {t("routers.detail.openMonitoring")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              onClick={() => navigate("/routers")}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              {t("routers.detail.back")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canEdit}
              title={!canEdit ? t("routers.permissionEdit") : undefined}
              onClick={() => {
                const el = document.getElementById("router-form")
                el?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("routers.detail.edit")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((metric) => (
          <KpiCard key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <KeyValueSummaryGrid
          items={[
            { label: "Router", value: router.name },
            { label: "IP", value: router.ip },
            { label: "Puerto", value: String(router.port) },
            { label: "Usuario", value: router.username },
            { label: "Zona", value: router.zone },
            { label: "Ubicacion", value: router.location },
            { label: t("routers.detail.lastChecked"), value: lastCheckedLabel },
            { label: t("monitoring.interfaces.status"), value: router.status === "online" ? t("routers.status.online") : t("routers.status.offline") },
          ]}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("routers.detail.health")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {health ? <RouterHealthCard health={health} /> : <StateMessage variant="empty" title={t("monitoring.emptyMetrics")} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("routers.detail.connection")}</CardTitle>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}>
              {router.status === "online" ? t("routers.status.online") : t("routers.status.offline")}
            </span>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <KpiCard label={t("routers.detail.connectionLatency")} value={router.status === "online" ? "12 ms" : "-"} />
              <KpiCard label={t("routers.detail.connectionRetries")} value={router.status === "online" ? "0" : "N/A"} />
            </div>
            <p className="text-sm text-muted-foreground">{t("routers.detail.connectionHint")}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm" id="router-form">
          <CardHeader>
            <CardTitle>{t("routers.detail.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RouterForm
              initialValues={initialValues}
              submitLabel={t("common.save")}
              canEdit={canEdit}
              onSubmit={handleSubmit}
              onTestConnection={testRouterConnection}
              passwordRequired={false}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("installation.router.title")}</CardTitle>
            <span className="text-xs text-muted-foreground">{installations.length} {t("installation.router.countSuffix")}</span>
          </CardHeader>
          <CardContent>
            {installations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("installation.router.empty")}</p>
            ) : (
              <div className="grid gap-3">
                {installations.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.clientPhone || t("clients.table.phone")} - {item.clientPlan}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("installation.form.operationType")}: {t(`installation.operationType.${item.operationType}`)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.installedAt ? new Date(item.installedAt).toLocaleString("es-CO") : t("installation.router.noDate")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {t(`installation.status.${item.status}`)}
                        </span>
                        <Button variant="outline" className="h-8 px-2.5 text-xs" onClick={() => navigate(`/clients/${item.clientId}`)}>
                          {t("installation.router.openClient")}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Backups operativos</CardTitle>
            <Button onClick={handleCreateBackup} disabled={!canEdit}>
              Crear backup
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {backups.length === 0 ? (
              <StateMessage variant="empty" title="No hay backups registrados" description="Genera el primer backup del router para tener versionado operativo." />
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{backup.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(backup.createdAt).toLocaleString("es-CO")} - {(backup.sizeBytes / 1024).toFixed(1)} KB - {backup.source}
                    </p>
                    <p className="text-xs text-muted-foreground">Checksum: {backup.checksum.slice(0, 16)}...</p>
                  </div>
                  <Button variant="outline" onClick={() => handleDownloadBackup(backup)}>
                    Descargar
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default RouterDetailPage

