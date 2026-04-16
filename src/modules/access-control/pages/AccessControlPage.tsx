import { useMemo, useState } from "react"
import { Clock3, Eye, KeyRound, RefreshCw, ShieldCheck, ShieldX } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { readSecurityAudit, writeSecurityAudit, type SecurityAuditEntry } from "@/auth/auditLog"
import { cn } from "@/lib/utils"
import { permissionCatalog } from "@/auth/permissionCatalog"
import {
  appRoles,
  getRolePermissions,
  getRolePermissionsMap,
  getRoleStatusMap,
  resetAllRolePermissions,
  resetRolePermissions,
  resetRoleStatus,
  roleLabels,
  setRoleEnabled,
  setRolePermissions,
} from "@/auth/permissions"
import { useCan } from "@/auth/usePermission"
import type { Permission, Role } from "@/auth/types"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"

type ViewMode = "detail" | "matrix"
type MatrixActionFilter = "all" | "read" | "write"
type MatrixCoverageFilter = "all" | "with_blocked" | "all_enabled"

const countPermissionDiff = (before: Permission[], after: Permission[]) => {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  let changes = 0

  for (const permission of beforeSet) {
    if (!afterSet.has(permission)) changes += 1
  }
  for (const permission of afterSet) {
    if (!beforeSet.has(permission)) changes += 1
  }

  return changes
}

const createAuditId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const AccessControlPage = () => {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const { notify, confirm } = useUI()
  const canWriteRoles = useCan("roles.write")
  const user = useAuthStore((state) => state.user)
  const setPermissions = useAuthStore((state) => state.setPermissions)

  const [selectedRole, setSelectedRole] = useState<Role>("admin")
  const [viewMode, setViewMode] = useState<ViewMode>("detail")
  const [showTechnicalCodes, setShowTechnicalCodes] = useState(false)
  const [matrixSearch, setMatrixSearch] = useState("")
  const [matrixModuleFilter, setMatrixModuleFilter] = useState("all")
  const [matrixActionFilter, setMatrixActionFilter] = useState<MatrixActionFilter>("all")
  const [matrixCoverageFilter, setMatrixCoverageFilter] = useState<MatrixCoverageFilter>("all")
  const [permissionsByRole, setPermissionsByRole] = useState<Record<Role, Permission[]>>(() => getRolePermissionsMap())
  const [roleStatusByRole, setRoleStatusByRole] = useState<Record<Role, boolean>>(() => getRoleStatusMap())
  const [auditEntries, setAuditEntries] = useState<SecurityAuditEntry[]>(() => readSecurityAudit())

  const formatDateTime = (isoDate: string) => {
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(isoDate))
  }

  const selectedPermissions = useMemo(() => permissionsByRole[selectedRole] ?? [], [permissionsByRole, selectedRole])
  const selectedRoleEnabled = roleStatusByRole[selectedRole]

  const groupedCatalog = useMemo(() => {
    const groups = new Map<string, typeof permissionCatalog>()
    for (const item of permissionCatalog) {
      const current = groups.get(item.module) ?? []
      current.push(item)
      groups.set(item.module, current)
    }
    return Array.from(groups.entries())
  }, [])

  const moduleSummary = useMemo(() => {
    const summary = new Map<string, { total: number; enabled: number }>()
    for (const item of permissionCatalog) {
      const current = summary.get(item.module) ?? { total: 0, enabled: 0 }
      current.total += 1
      if (selectedPermissions.includes(item.permission)) {
        current.enabled += 1
      }
      summary.set(item.module, current)
    }
    return Array.from(summary.entries())
  }, [selectedPermissions])

  const matrixModuleOptions = useMemo(() => {
    return Array.from(new Set(permissionCatalog.map((item) => item.module)))
  }, [])

  const filteredMatrixRows = useMemo(() => {
    const term = matrixSearch.trim().toLowerCase()

    return permissionCatalog.filter((item) => {
      if (matrixModuleFilter !== "all" && item.module !== matrixModuleFilter) return false
      if (matrixActionFilter !== "all" && item.action !== matrixActionFilter) return false

      const enabledCount = appRoles.reduce((count, role) => {
        return (permissionsByRole[role] ?? []).includes(item.permission) ? count + 1 : count
      }, 0)

      if (matrixCoverageFilter === "all_enabled" && enabledCount !== appRoles.length) return false
      if (matrixCoverageFilter === "with_blocked" && enabledCount === appRoles.length) return false

      if (!term) return true

      const technicalCode = showTechnicalCodes ? item.permission : ""
      const haystack = [item.label, item.description, item.module, technicalCode].join(" ").toLowerCase()
      return haystack.includes(term)
    })
  }, [matrixActionFilter, matrixCoverageFilter, matrixModuleFilter, matrixSearch, permissionsByRole, showTechnicalCodes])

  const appendAudit = (entry: Omit<SecurityAuditEntry, "id" | "createdAt">) => {
    const next: SecurityAuditEntry = {
      id: createAuditId(),
      createdAt: new Date().toISOString(),
      ...entry,
    }

    setAuditEntries((current) => {
      const updated = [next, ...current].slice(0, 50)
      writeSecurityAudit(updated)
      return updated
    })
  }

  const handleToggleRoleStatus = (role: Role, enabled: boolean) => {
    if (!canWriteRoles) return
    if (user?.role === role && !enabled) {
      notify({
        title: t("accessControl.operationBlocked"),
        description: t("accessControl.cannotDisableCurrentRole"),
        type: "error",
      })
      return
    }

    if (role === "admin" && !enabled) {
      const activeAdmins = appRoles.filter((item) => item === "admin" && roleStatusByRole[item]).length
      if (activeAdmins <= 1) {
        notify({
          title: t("accessControl.operationBlocked"),
          description: t("accessControl.atLeastOneAdmin"),
          type: "error",
        })
        return
      }
    }

    setRoleEnabled(role, enabled)
    setRoleStatusByRole((current) => ({ ...current, [role]: enabled }))
    appendAudit({
      actorName: user?.name ?? t("internalUsers.localUser"),
      actorRole: user?.role ?? "admin",
      targetRole: role,
      action: "toggle_role_status",
      details: t("accessControl.audit.roleToggled", {
        role: roleLabels[role],
        status: enabled ? t("internalUsers.status.active").toLowerCase() : t("internalUsers.status.inactive").toLowerCase(),
      }),
    })
    notify({
      title: enabled ? t("accessControl.roleEnabledTitle") : t("accessControl.roleDisabledTitle"),
      description: enabled
        ? t("accessControl.roleEnabledDesc", { role: roleLabels[role] })
        : t("accessControl.roleDisabledDesc", { role: roleLabels[role] }),
      type: enabled ? "success" : "info",
    })
  }

  const togglePermissionForRole = (role: Role, permission: Permission) => {
    if (!canWriteRoles) return

    setPermissionsByRole((current) => {
      const currentPermissions = new Set(current[role] ?? [])
      if (currentPermissions.has(permission)) {
        currentPermissions.delete(permission)
      } else {
        currentPermissions.add(permission)
      }

      return {
        ...current,
        [role]: Array.from(currentPermissions),
      }
    })
  }

  const handleSave = () => {
    const before = getRolePermissions(selectedRole)
    const changes = countPermissionDiff(before, selectedPermissions)

    setRolePermissions(selectedRole, selectedPermissions)
    if (user?.role === selectedRole) {
      setPermissions(selectedPermissions)
    }

    appendAudit({
      actorName: user?.name ?? t("internalUsers.localUser"),
      actorRole: user?.role ?? "admin",
      targetRole: selectedRole,
      action: "save",
      details: t("accessControl.audit.permissionsUpdated", { changes, role: roleLabels[selectedRole] }),
    })

    notify({
      title: t("accessControl.permissionsSaved"),
      description: t("accessControl.permissionsSavedDesc", { role: roleLabels[selectedRole] }),
      type: "success",
    })
  }

  const handleSaveAllRoles = () => {
    for (const role of appRoles) {
      setRolePermissions(role, permissionsByRole[role] ?? [])
    }

    if (user) {
      setPermissions(permissionsByRole[user.role] ?? [])
    }

    appendAudit({
      actorName: user?.name ?? t("internalUsers.localUser"),
      actorRole: user?.role ?? "admin",
      targetRole: "all",
      action: "save_all",
      details: t("accessControl.audit.savedAll"),
    })

    notify({
      title: t("accessControl.matrixSaved"),
      description: t("accessControl.matrixSavedDesc"),
      type: "success",
    })
  }

  const handleResetRole = async () => {
    const accepted = await confirm({
      title: t("accessControl.restoreRoleTitle"),
      description: t("accessControl.restoreRoleDesc"),
      confirmLabel: t("accessControl.restore"),
    })
    if (!accepted) return

    resetRolePermissions(selectedRole)
    resetRoleStatus(selectedRole)
    const nextMap = getRolePermissionsMap()
    setPermissionsByRole(nextMap)
    const nextStatus = getRoleStatusMap()
    setRoleStatusByRole(nextStatus)
    if (user?.role === selectedRole) {
      setPermissions(nextMap[selectedRole])
    }

    appendAudit({
      actorName: user?.name ?? t("internalUsers.localUser"),
      actorRole: user?.role ?? "admin",
      targetRole: selectedRole,
      action: "reset_role",
      details: t("accessControl.audit.roleRestored", { role: roleLabels[selectedRole] }),
    })

    notify({
      title: t("accessControl.roleRestoredTitle"),
      description: t("accessControl.roleRestoredDesc", { role: roleLabels[selectedRole] }),
      type: "info",
    })
  }

  const handleResetAll = async () => {
    const accepted = await confirm({
      title: t("accessControl.restoreAllTitle"),
      description: t("accessControl.restoreAllDesc"),
      confirmLabel: t("accessControl.restoreAll"),
    })
    if (!accepted) return

    resetAllRolePermissions()
    const nextMap = getRolePermissionsMap()
    setPermissionsByRole(nextMap)
    const nextStatus = getRoleStatusMap()
    setRoleStatusByRole(nextStatus)
    if (user) {
      setPermissions(nextMap[user.role])
    }

    appendAudit({
      actorName: user?.name ?? t("internalUsers.localUser"),
      actorRole: user?.role ?? "admin",
      targetRole: "all",
      action: "reset_all",
      details: t("accessControl.audit.allRestored"),
    })

    notify({
      title: t("accessControl.configRestoredTitle"),
      description: t("accessControl.configRestoredDesc"),
      type: "info",
    })
  }

  const clearAudit = async () => {
    const accepted = await confirm({
      title: t("accessControl.clearHistoryTitle"),
      description: t("accessControl.clearHistoryDesc"),
      confirmLabel: t("accessControl.clear"),
    })
    if (!accepted) return

    setAuditEntries([])
    writeSecurityAudit([])
    notify({ title: t("accessControl.historyCleared"), type: "success" })
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,#0f172a,#0f4c81_52%,#0c7a6a)] p-6 text-white">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("nav.security")}</p>
            <h1 className="mt-2 text-2xl font-semibold">{t("accessControl.title")}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-100/90">{t("accessControl.description")}</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs text-cyan-100">{t("accessControl.enabledPermissions", { role: roleLabels[selectedRole] })}</p>
            <p className="text-2xl font-semibold">{selectedPermissions.length}</p>
          </div>
        </div>
      </section>

      {!canWriteRoles && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("accessControl.readOnlyWarning")}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{t("accessControl.subtitle")}</p>
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "detail" ? "default" : "outline"} onClick={() => setViewMode("detail")}>
              {t("accessControl.detailedView")}
            </Button>
            <Button variant={viewMode === "matrix" ? "default" : "outline"} onClick={() => setViewMode("matrix")}>
              {t("accessControl.matrixView")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {moduleSummary.map(([moduleName, summary]) => {
          const fullyEnabled = summary.enabled === summary.total
          return (
            <div key={moduleName} className="rounded-xl border border-border bg-card p-3">
              <p className="text-sm font-semibold text-foreground">{moduleName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("accessControl.moduleSummary", { enabled: summary.enabled, total: summary.total })}</p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  fullyEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                )}
              >
                {fullyEnabled ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                {fullyEnabled ? t("accessControl.complete") : t("accessControl.partial")}
              </span>
            </div>
          )
        })}
      </section>

      {viewMode === "detail" ? (
        <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                {t("accessControl.roles")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {appRoles.map((role) => {
                const selected = selectedRole === role
                const count = permissionsByRole[role]?.length ?? 0
                const enabled = roleStatusByRole[role]
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                      selected
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{roleLabels[role]}</p>
                      <p className="text-xs uppercase tracking-wide opacity-80">{role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          enabled ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                        )}
                      >
                        {enabled ? t("internalUsers.status.active") : t("internalUsers.status.inactive")}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{count}</span>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t("accessControl.permissionsFor", { role: roleLabels[selectedRole] })}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={selectedRoleEnabled ? "outline" : "default"}
                    onClick={() => handleToggleRoleStatus(selectedRole, !selectedRoleEnabled)}
                    disabled={!canWriteRoles}
                    title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}
                  >
                    {selectedRoleEnabled ? t("accessControl.disableRole") : t("accessControl.enableRole")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowTechnicalCodes((current) => !current)}>
                    {showTechnicalCodes ? t("accessControl.hideCodes") : t("accessControl.showCodes")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetRole}
                    disabled={!canWriteRoles}
                    title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("accessControl.restoreRole")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetAll}
                    disabled={!canWriteRoles}
                    title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}
                  >
                    {t("accessControl.restoreAll")}
                  </Button>
                  <Button onClick={handleSave} disabled={!canWriteRoles} title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}>
                    {t("accessControl.saveChanges")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {groupedCatalog.map(([moduleName, items]) => (
                <div key={moduleName} className="rounded-xl border border-border">
                  <div className="border-b border-border bg-muted/40 px-4 py-2">
                    <p className="text-sm font-semibold text-foreground">{moduleName}</p>
                  </div>
                  <div className="divide-y divide-border/60">
                    {items.map((item) => {
                      const checked = selectedPermissions.includes(item.permission)
                      return (
                        <label
                          key={item.permission}
                          className={cn("flex cursor-pointer items-center justify-between gap-4 px-4 py-3", !canWriteRoles && "cursor-not-allowed opacity-80")}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                            {showTechnicalCodes && <p className="mt-1 text-[11px] text-muted-foreground">{t("accessControl.technicalCode", { code: item.permission })}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", checked ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                              {checked ? t("accessControl.allowed") : t("accessControl.blocked")}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canWriteRoles}
                              onChange={() => togglePermissionForRole(selectedRole, item.permission)}
                              className="h-4 w-4 rounded border-border"
                            />
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t("accessControl.compactMatrix")}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setShowTechnicalCodes((current) => !current)}>
                  {showTechnicalCodes ? t("accessControl.hideCodes") : t("accessControl.showCodes")}
                </Button>
                <Button variant="outline" onClick={handleResetAll} disabled={!canWriteRoles} title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}>
                  {t("accessControl.restoreAll")}
                </Button>
                <Button onClick={handleSaveAllRoles} disabled={!canWriteRoles} title={!canWriteRoles ? t("accessControl.noPermissionModify") : undefined}>
                  {t("accessControl.saveAll")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="search"
                value={matrixSearch}
                onChange={(event) => setMatrixSearch(event.target.value)}
                placeholder={t("accessControl.searchPermissionPlaceholder")}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              />
              <select
                value={matrixModuleFilter}
                onChange={(event) => setMatrixModuleFilter(event.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              >
                <option value="all">{t("accessControl.allModules")}</option>
                {matrixModuleOptions.map((moduleName) => (
                  <option key={moduleName} value={moduleName}>
                    {moduleName}
                  </option>
                ))}
              </select>
              <select
                value={matrixActionFilter}
                onChange={(event) => setMatrixActionFilter(event.target.value as MatrixActionFilter)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              >
                <option value="all">{t("accessControl.readAndWrite")}</option>
                <option value="read">{t("accessControl.readOnlyFilter")}</option>
                <option value="write">{t("accessControl.writeOnlyFilter")}</option>
              </select>
              <select
                value={matrixCoverageFilter}
                onChange={(event) => setMatrixCoverageFilter(event.target.value as MatrixCoverageFilter)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              >
                <option value="all">{t("accessControl.allStatuses")}</option>
                <option value="with_blocked">{t("accessControl.withBlockedOnly")}</option>
                <option value="all_enabled">{t("accessControl.allEnabledOnly")}</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">{t("accessControl.permission")}</th>
                    <th className="px-3 py-2 font-semibold">{t("accessControl.module")}</th>
                    {appRoles.map((role) => (
                      <th key={role} className="px-3 py-2 text-center font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <span>{roleLabels[role]}</span>
                          <button
                            type="button"
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold normal-case",
                              roleStatusByRole[role] ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                            )}
                            onClick={() => handleToggleRoleStatus(role, !roleStatusByRole[role])}
                            disabled={!canWriteRoles}
                            title={
                              !canWriteRoles
                                ? t("accessControl.noPermissionModify")
                                : roleStatusByRole[role]
                                  ? t("accessControl.disableRole")
                                  : t("accessControl.enableRole")
                            }
                          >
                            {roleStatusByRole[role] ? t("internalUsers.status.active") : t("internalUsers.status.inactive")}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrixRows.map((item) => (
                    <tr key={item.permission} className="border-t border-border/60">
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        {showTechnicalCodes && <p className="text-[11px] text-muted-foreground">{item.permission}</p>}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{item.module}</td>
                      {appRoles.map((role) => {
                        const checked = (permissionsByRole[role] ?? []).includes(item.permission)
                        return (
                          <td key={`${role}-${item.permission}`} className="px-3 py-2 text-center">
                            <label className={cn("inline-flex items-center gap-2 rounded-full px-2 py-1", checked ? "bg-emerald-50" : "bg-rose-50")}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!canWriteRoles}
                                onChange={() => togglePermissionForRole(role, item.permission)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className={cn("text-xs font-semibold", checked ? "text-emerald-700" : "text-rose-700")}>{checked ? t("accessControl.yes") : t("accessControl.no")}</span>
                            </label>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMatrixRows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t("accessControl.noMatchingPermissions")}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              {t("accessControl.localHistory")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/security-audit")}>
                {t("accessControl.openFullAudit")}
              </Button>
              <Button variant="outline" onClick={clearAudit}>
                {t("accessControl.clearHistory")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("accessControl.noChangesYet")}</p>
          ) : (
            <ul className="grid gap-2">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-sm text-foreground">{entry.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt)} - {entry.actorName} ({roleLabels[entry.actorRole]})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">{t("accessControl.quickGuide")}</h2>
        <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Eye className="mt-0.5 h-4 w-4 shrink-0" />
            {t("accessControl.guide.read")}
          </li>
          <li className="flex items-start gap-2">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
            {t("accessControl.guide.manage")}
          </li>
          <li className="flex items-start gap-2">
            <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
            {t("accessControl.guide.inactiveRole")}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default AccessControlPage
