import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Filter, Plus, RefreshCw, Search } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import DataTableShell from "@/components/shared/DataTableShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { getInstallations } from "../services/installationsApi"
import type { Installation, InstallationOperationType, InstallationStatus } from "../types/installation"

const statusOptions: Array<InstallationStatus | ""> = ["", "pending", "scheduled", "installed", "suspended", "canceled"]
const operationTypeOptions: Array<InstallationOperationType | ""> = ["", "installation", "relocation", "replacement", "removal"]

const formatDateTime = (value: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const normalize = (value: string) => value.toLowerCase().trim()

const InstallationsListPage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const canCreate = useCan("visits.write")
  const canManage = useCan("visits.write")
  const [installations, setInstallations] = useState<Installation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InstallationStatus | "">("")
  const [typeFilter, setTypeFilter] = useState<InstallationOperationType | "">("")

  const loadInstallations = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getInstallations()
      setInstallations(data)
    } catch (err) {
      setError(getErrorMessage(err, t("installation.list.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInstallations()
  }, [])

  const filtered = useMemo(() => {
    const query = normalize(search)
    return installations.filter((item) => {
      const statusMatch = !statusFilter || item.status === statusFilter
      const typeMatch = !typeFilter || item.operationType === typeFilter
      const searchMatch =
        !query ||
        [
          item.clientName,
          item.clientPhone,
          item.clientAddress,
          item.routerName,
          item.routerIp,
          item.notes,
          item.visitType,
          item.routerZone,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      return statusMatch && typeMatch && searchMatch
    })
  }, [installations, search, statusFilter, typeFilter])

  const stats = useMemo(
    () => ({
      total: installations.length,
      installed: installations.filter((item) => item.status === "installed").length,
      scheduled: installations.filter((item) => item.status === "scheduled").length,
      suspended: installations.filter((item) => item.status === "suspended").length,
    }),
    [installations],
  )

  if (loading) return <StateMessage variant="loading" title={t("installation.list.loading")} />
  if (error) return <StateMessage variant="error" title={t("installation.list.loadErrorTitle")} description={error} />

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{t("installation.list.kicker")}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("installation.list.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("installation.list.description")}</p>
        </div>
        <Button
          onClick={() => navigate("/installations/new")}
          disabled={!canCreate}
          title={!canCreate ? t("visits.permissionManage") : undefined}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("installation.list.create")}
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("installation.list.total")} value={String(stats.total)} />
        <KpiCard label={t("installation.list.installed")} value={String(stats.installed)} />
        <KpiCard label={t("installation.list.scheduled")} value={String(stats.scheduled)} />
        <KpiCard label={t("installation.list.suspended")} value={String(stats.suspended)} />
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("installation.list.searchPlaceholder")}
              className="h-10 pl-9"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              {t("installation.list.statusFilter")}
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InstallationStatus | "")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            >
              {statusOptions.map((status) => (
                <option key={status || "all"} value={status}>
                  {status ? t(`installation.status.${status}`) : t("installation.list.all")}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              {t("installation.list.typeFilter")}
            </span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as InstallationOperationType | "")}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            >
              {operationTypeOptions.map((operationType) => (
                <option key={operationType || "all"} value={operationType}>
                  {operationType ? t(`installation.operationType.${operationType}`) : t("installation.list.all")}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" variant="outline" className="h-10 self-end" onClick={loadInstallations}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("common.refresh")}
          </Button>
        </div>
      </section>

      {filtered.length === 0 ? (
        <StateMessage variant="empty" title={t("installation.list.emptyTitle")} description={t("installation.list.emptyDesc")} />
      ) : (
        <DataTableShell>
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.client")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.type")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.router")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.visit")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.updated")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("installation.list.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.clientName}</p>
                      <p className="text-xs text-muted-foreground">{item.clientPhone || item.clientAddress}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                      {t(`installation.operationType.${item.operationType}`)}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {t(`installation.status.${item.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.routerName || t("installation.client.noRouter")}</p>
                      <p className="text-xs text-muted-foreground">{item.routerIp || item.routerZone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.visitType ? t(`visits.form.type.${item.visitType}`) : t("installation.client.noVisit")}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.visitScheduledAt ? formatDateTime(item.visitScheduledAt) : t("installation.client.noDate")}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm text-foreground">{formatDateTime(item.updatedAt)}</p>
                    <p className="text-xs text-muted-foreground">{item.installedAt ? formatDateTime(item.installedAt) : t("common.empty")}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => navigate(`/clients/${item.clientId}`)}>
                        {t("installation.list.openClient")}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-3 text-xs"
                        disabled={!canManage}
                        title={!canManage ? t("visits.permissionManage") : undefined}
                        onClick={() => navigate(`/installations/${item.id}/edit`)}
                      >
                        {t("installation.list.edit")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      )}
    </div>
  )
}

export default InstallationsListPage
