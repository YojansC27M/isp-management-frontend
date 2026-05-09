import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorDescription, getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { downloadSecurityAuditExport, getSecurityAuditEntries, getSecurityAuditPage } from "../services/securityAuditApi"
import type { SecurityAuditEntry, SecurityAuditFilters, SecurityAuditStats } from "../types/securityAudit"

const initialFilters: SecurityAuditFilters = {
  search: "",
  actorId: "",
  action: "",
  module: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  perPage: 25,
}

const isSameDay = (dateA: Date, dateB: Date) => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

const buildStats = (entries: SecurityAuditEntry[]): SecurityAuditStats => {
  const now = new Date()
  const last7Cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000
  const sensitiveRegex = /(reset|revoke|delete|disable|logout_all)/i

  return {
    total: entries.length,
    todayCount: entries.filter((entry) => isSameDay(new Date(entry.createdAt), now)).length,
    last7Count: entries.filter((entry) => new Date(entry.createdAt).getTime() >= last7Cutoff).length,
    sensitiveCount: entries.filter((entry) => sensitiveRegex.test(entry.action)).length,
  }
}

const SecurityAuditPage = () => {
  const { t } = useI18n()
  const { notify } = useUI()

  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState<SecurityAuditFilters>(initialFilters)
  const [entries, setEntries] = useState<SecurityAuditEntry[]>([])
  const [allEntries, setAllEntries] = useState<SecurityAuditEntry[]>([])
  const [pageMeta, setPageMeta] = useState({ page: 1, perPage: 25, total: 0, totalPages: 1 })
  const [selectedEntry, setSelectedEntry] = useState<SecurityAuditEntry | null>(null)

  const loadEntries = useCallback(async () => {
    if (filters.dateFrom && filters.dateTo && new Date(filters.dateFrom).getTime() > new Date(filters.dateTo).getTime()) {
      setError(t("securityAudit.invalidDateRange"))
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    try {
      const [pageResult, fullResult] = await Promise.all([
        getSecurityAuditPage({
          page: filters.page,
          perPage: filters.perPage,
          actorId: filters.actorId,
          action: filters.action,
          module: filters.module,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }),
        getSecurityAuditEntries({
          limit: 500,
          actorId: filters.actorId,
          action: filters.action,
          module: filters.module,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        }),
      ])

      setEntries(pageResult.items)
      setPageMeta(pageResult.meta)
      setAllEntries(fullResult)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar auditoria de seguridad."))
    } finally {
      setLoading(false)
    }
  }, [filters.action, filters.actorId, filters.dateFrom, filters.dateTo, filters.module, filters.page, filters.perPage, t])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const filteredEntries = useMemo(() => {
    const term = filters.search?.trim().toLowerCase() ?? ""
    if (!term) return entries

    return entries.filter((entry) => {
      const haystack = [
        entry.action,
        entry.entity,
        entry.entityId ?? "",
        entry.actor?.name ?? "",
        entry.actor?.email ?? "",
        JSON.stringify(entry.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [entries, filters.search])

  const stats = useMemo(() => buildStats(allEntries), [allEntries])
  const availableActions = useMemo(() => Array.from(new Set(allEntries.map((entry) => entry.action))).sort((a, b) => a.localeCompare(b)), [allEntries])
  const availableModules = useMemo(() => Array.from(new Set(allEntries.map((entry) => entry.entity))).sort((a, b) => a.localeCompare(b)), [allEntries])
  const availableActors = useMemo(
    () =>
      Array.from(
        new Map(
          allEntries
            .filter((entry) => entry.actor?.id)
            .map((entry) => [entry.actor?.id as string, { id: entry.actor?.id as string, name: entry.actor?.name ?? "Usuario" }]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [allEntries],
  )

  const formatDateTime = (value: string) => {
    const locale = navigator.language.startsWith("en") ? "en-US" : "es-CO"
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  }

  const exportWithFormat = async (format: "csv" | "json" | "xlsx") => {
    setExporting(true)
    try {
      const blob = await downloadSecurityAuditExport(
        {
          limit: 500,
          actorId: filters.actorId,
          action: filters.action,
          module: filters.module,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        format,
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `security-audit-${new Date().toISOString().slice(0, 10)}.${format}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      notify({
        title: "No se pudo exportar auditoria",
        description: getErrorDescription(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    } finally {
      setExporting(false)
    }
  }

  const actionLabel = (action: string) => {
    const known: Record<string, string> = {
      "auth.login_succeeded": "Inicio de sesión exitoso",
      "auth.login_failed": "Intento de inicio fallido",
      "auth.logout": "Cierre de sesión",
      "auth.logout_all": "Cierre de sesión en todos los dispositivos",
      "roles.update_permissions": "Actualización de permisos de perfil",
      "roles.update_permissions.noop": "Sin cambios en permisos de perfil",
      "roles.reset_permissions": "Restauración de permisos del perfil",
      "roles.reset_all_permissions": "Restauración global de permisos",
      "users.permissions_overrides.update": "Actualización de excepciones por usuario",
      "users.permissions_overrides.update.noop": "Sin cambios en excepciones por usuario",
    }
    if (known[action]) return known[action]

    const key = `securityAudit.action.${action.replace(/\./g, "_")}`
    const translated = t(key)
    if (translated !== key) return translated

    const normalizeChunk = (chunk: string) =>
      chunk
        .replace(/_/g, " ")
        .trim()
        .replace(/\b\w/g, (letter: string) => letter.toUpperCase())

    const parts = action.split(".").filter(Boolean)
    if (parts.length === 0) return action
    if (parts.length === 1) return normalizeChunk(parts[0])

    const [moduleName, ...rest] = parts
    return `${normalizeChunk(rest.join(" "))} (${entityLabel(moduleName)})`
  }

  const entityLabel = (entity: string) => {
    const known: Record<string, string> = {
      auth: "Autenticacion",
      role: "Perfiles",
      user: "Usuarios",
      permission: "Permisos",
      security: "Seguridad",
    }
    if (known[entity]) return known[entity]
    return entity
      .replace(/_/g, " ")
      .trim()
      .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
  }

  const describeEntry = (entry: SecurityAuditEntry) => {
    const metadata = entry.metadata ?? {}
    if (entry.action === "auth.login_succeeded") {
      return "Un usuario ingreso correctamente al sistema."
    }
    if (entry.action === "auth.login_failed") {
      return "Se detecto un intento de ingreso fallido."
    }
    if (entry.action === "auth.logout") {
      return "El usuario cerro su sesion."
    }
    if (entry.action === "auth.logout_all") {
      return "Se cerraron todas las sesiones activas del usuario."
    }
    if (entry.action === "roles.update_permissions") {
      const added = Array.isArray(metadata.added) ? metadata.added.length : 0
      const removed = Array.isArray(metadata.removed) ? metadata.removed.length : 0
      return `Permisos agregados: ${added}. Permisos removidos: ${removed}.`
    }
    if (entry.action === "users.permissions_overrides.update") {
      const grants = Array.isArray(metadata.grants) ? metadata.grants.length : 0
      const revokes = Array.isArray(metadata.revokes) ? metadata.revokes.length : 0
      return `Excepciones por usuario actualizadas. Permitir: ${grants}, bloquear: ${revokes}.`
    }
    if (entry.action === "roles.reset_permissions") {
      return "Se restauraron permisos base del perfil."
    }
    if (entry.action === "roles.reset_all_permissions") {
      return "Se restauraron permisos base de todos los perfiles."
    }
    const eventName = actionLabel(entry.action).toLowerCase()
    const moduleName = entityLabel(entry.entity).toLowerCase()
    return `Se registro el evento "${eventName}" en ${moduleName}.`
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,#111827,#1d4ed8_52%,#0d9488)] p-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("securityAudit.governance")}</p>
            <h1 className="mt-2 text-2xl font-semibold">{t("nav.security-audit")}</h1>
            <p className="mt-1 text-sm text-slate-100/90">Auditoria centralizada desde backend para roles, permisos y eventos de seguridad.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="border-white/70 bg-white/90 text-slate-900 shadow-sm hover:bg-white dark:border-white/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              onClick={loadEntries}
              disabled={loading}
            >
              {t("securityAudit.refresh")}
            </Button>
            <Button
              variant="outline"
              className="border-white/50 bg-cyan-100/90 text-cyan-950 shadow-sm hover:bg-cyan-100 disabled:border-white/30 disabled:bg-white/40 disabled:text-slate-500 dark:border-cyan-200/35 dark:bg-cyan-200/15 dark:text-cyan-50 dark:hover:bg-cyan-200/25 dark:disabled:border-white/20 dark:disabled:bg-white/10 dark:disabled:text-white/40"
              onClick={() => void exportWithFormat("csv")}
              disabled={exporting}
            >
              {exporting ? t("common.loading") : t("reports.exportCsv")}
            </Button>
            <Button
              variant="outline"
              className="border-white/50 bg-violet-100/90 text-violet-950 shadow-sm hover:bg-violet-100 dark:border-violet-200/35 dark:bg-violet-200/15 dark:text-violet-50 dark:hover:bg-violet-200/25"
              onClick={() => void exportWithFormat("json")}
              disabled={exporting}
            >
              {t("securityAudit.exportJson")}
            </Button>
            <Button
              variant="outline"
              className="border-white/50 bg-emerald-100/90 text-emerald-950 shadow-sm hover:bg-emerald-100 dark:border-emerald-200/35 dark:bg-emerald-200/15 dark:text-emerald-50 dark:hover:bg-emerald-200/25"
              onClick={() => void exportWithFormat("xlsx")}
              disabled={exporting}
            >
              {t("reports.exportXlsx")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.total")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.today")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{stats.todayCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.last7")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{stats.last7Count}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.risky")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{stats.sensitiveCount}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>{t("securityAudit.filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder={t("securityAudit.searchPlaceholder")}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          />
          <select
            value={filters.actorId}
            onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value, page: 1 }))}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="">{t("securityAudit.all")}</option>
            {availableActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
          <select
            value={filters.action}
            onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value, page: 1 }))}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="">{t("securityAudit.allFemale")}</option>
            {availableActions.map((action) => (
              <option key={action} value={action}>
                {actionLabel(action)}
              </option>
            ))}
          </select>
          <select
            value={filters.module}
            onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value, page: 1 }))}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="">{t("securityAudit.all")}</option>
            {availableModules.map((moduleName) => (
              <option key={moduleName} value={moduleName}>
                {moduleName}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value, page: 1 }))}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value, page: 1 }))}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          />
        </CardContent>
      </Card>

      {loading ? (
        <StateMessage variant="loading" title={t("securityAudit.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("securityAudit.loadErrorTitle")} description={error} />
      ) : filteredEntries.length === 0 ? (
        <StateMessage variant="empty" title={t("securityAudit.noEvents")} />
      ) : (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{t("securityAudit.events")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {filteredEntries.map((entry) => (
                <li key={entry.id} className="overflow-hidden rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 max-w-full break-words text-sm font-medium text-foreground">
                      {actionLabel(entry.action)} en {entityLabel(entry.entity)}
                      {entry.entityId ? ` (${entry.entityId})` : ""}
                    </p>
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{describeEntry(entry)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-card px-2 py-0.5">{t("securityAudit.actorLabel")}: {entry.actor?.name ?? t("securityAudit.system")}</span>
                    <span className="rounded-full bg-card px-2 py-0.5">{t("securityAudit.emailLabel")}: {entry.actor?.email || t("securityAudit.notAvailable")}</span>
                    <span className="rounded-full bg-card px-2 py-0.5">{t("securityAudit.roleLabel")}: {entry.actor?.roleName || entry.actor?.roleKey || t("securityAudit.notAvailable")}</span>
                  </div>
                  <div className="mt-2">
                    <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => setSelectedEntry(entry)}>
                      {t("securityAudit.viewDetail")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
              <span>
                {t("securityAudit.paginationSummary", { page: pageMeta.page, totalPages: pageMeta.totalPages, total: pageMeta.total })}
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs">{t("securityAudit.perPage")}</label>
                <select
                  value={filters.perPage}
                  onChange={(event) => setFilters((current) => ({ ...current, perPage: Number(event.target.value), page: 1 }))}
                  className="h-8 rounded-md border border-border bg-card px-2 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))}
                  disabled={pageMeta.page <= 1}
                >
                  {t("securityAudit.prev")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={() => setFilters((current) => ({ ...current, page: Math.min(pageMeta.totalPages, (current.page ?? 1) + 1) }))}
                  disabled={pageMeta.page >= pageMeta.totalPages}
                >
                  {t("securityAudit.next")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label={t("securityAudit.detailTitle")}>
          <button type="button" aria-label={t("securityAudit.closeDetail")} className="absolute inset-0" onClick={() => setSelectedEntry(null)} />
          <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-foreground">
                  {actionLabel(selectedEntry.action)} en {entityLabel(selectedEntry.entity)}
                  {selectedEntry.entityId ? ` (${selectedEntry.entityId})` : ""}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(selectedEntry.createdAt)}</p>
              </div>
              <Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => setSelectedEntry(null)}>
                {t("common.cancel")}
              </Button>
            </div>

            <div className="space-y-3 overflow-auto px-4 py-3 text-sm">
              <p className="text-muted-foreground">{describeEntry(selectedEntry)}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted/60 px-2 py-0.5">{t("securityAudit.actorLabel")}: {selectedEntry.actor?.name ?? t("securityAudit.system")}</span>
                <span className="rounded-full bg-muted/60 px-2 py-0.5">{t("securityAudit.emailLabel")}: {selectedEntry.actor?.email || t("securityAudit.notAvailable")}</span>
                <span className="rounded-full bg-muted/60 px-2 py-0.5">{t("securityAudit.roleLabel")}: {selectedEntry.actor?.roleName || selectedEntry.actor?.roleKey || t("securityAudit.notAvailable")}</span>
                <span className="rounded-full bg-muted/60 px-2 py-0.5">{t("securityAudit.moduleLabel")}: {entityLabel(selectedEntry.entity)}</span>
              </div>
              <pre className="max-w-full overflow-auto rounded-md border border-border/70 bg-background/70 p-2 text-[11px] text-muted-foreground">
                {JSON.stringify(selectedEntry.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SecurityAuditPage
