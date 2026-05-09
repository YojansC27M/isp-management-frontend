import { useCallback, useEffect, useMemo, useState } from "react"
import type { KeyboardEvent } from "react"
import { ShieldCheck } from "lucide-react"
import KpiCard from "@/components/shared/KpiCard"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getMe } from "@/auth/services/authApi"
import { normalizePermissions } from "@/auth/validators"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorDescription, getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import {
  getAccessPermissions,
  getAccessRoles,
  getUserPermissionOverrides,
  getRolePermissions,
  resetAllRolePermissions,
  resetRolePermissions,
  updateUserPermissionOverrides,
  updateRolePermissions,
} from "../services/accessControlApi"
import { getInternalUsers } from "@/modules/internal-users/services/internalUsersApi"
import type { InternalUser } from "@/modules/internal-users/types/internalUser"
import type { AccessPermission, AccessRole } from "../types/accessControl"
import { getSecurityAuditEntries } from "@/modules/security-audit/services/securityAuditApi"
import type { SecurityAuditEntry } from "@/modules/security-audit/types/securityAudit"

const inferAction = (permissionKey: string) => {
  if (permissionKey.endsWith(".read")) return "read"
  if (permissionKey.endsWith(".write")) return "write"
  return "other"
}

const AccessControlPage = () => {
  const { t } = useI18n()
  const { notify, confirm } = useUI()
  const canWriteRoles = useCan("roles.write")
  const authUser = useAuthStore((state) => state.user)
  const setPermissions = useAuthStore((state) => state.setPermissions)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [roles, setRoles] = useState<AccessRole[]>([])
  const [permissions, setPermissionsCatalog] = useState<AccessPermission[]>([])
  const [permissionsByRoleId, setPermissionsByRoleId] = useState<Record<string, string[]>>({})
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [draftPermissions, setDraftPermissions] = useState<string[]>([])
  const [showTechnicalCodes, setShowTechnicalCodes] = useState(false)
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState<"all" | "read" | "write">("all")
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [userGrantsDraft, setUserGrantsDraft] = useState<string[]>([])
  const [userRevokesDraft, setUserRevokesDraft] = useState<string[]>([])
  const [userBaseline, setUserBaseline] = useState<{ grants: string[]; revokes: string[] } | null>(null)
  const [loadingUserOverrides, setLoadingUserOverrides] = useState(false)
  const [overrideAudit, setOverrideAudit] = useState<SecurityAuditEntry[]>([])
  const [activeTab, setActiveTab] = useState<"roles" | "exceptions">("roles")
  const [userSearch, setUserSearch] = useState("")
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [comboboxActiveIndex, setComboboxActiveIndex] = useState(0)

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) ?? null, [roles, selectedRoleId])
  const selectedInternalUser = useMemo(
    () => internalUsers.find((user) => user.id === selectedUserId) ?? null,
    [internalUsers, selectedUserId],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [rolesData, permissionsData, usersData] = await Promise.all([getAccessRoles(), getAccessPermissions(), getInternalUsers({ status: "active" })])

      const rolePermissionsEntries = await Promise.all(
        rolesData.map(async (role) => {
          const payload = await getRolePermissions(role.id)
          return [role.id, payload.permissions] as const
        }),
      )

      const byRole = Object.fromEntries(rolePermissionsEntries)
      setRoles(rolesData)
      setPermissionsCatalog(permissionsData)
      setInternalUsers(usersData)
      setPermissionsByRoleId(byRole)
      const overrideEvents = await getSecurityAuditEntries({
        action: "users.permissions_overrides",
        limit: 20,
      })
      setOverrideAudit(overrideEvents)

      const firstRoleId = rolesData[0]?.id ?? ""
      const firstUserId = usersData[0]?.id ?? ""
      setSelectedRoleId((current) => (current && byRole[current] ? current : firstRoleId))
      setSelectedUserId((current) => current || firstUserId)
      setDraftPermissions((current) => {
        if (current.length > 0 && selectedRoleId) return current
        return byRole[firstRoleId] ?? []
      })
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar perfiles y permisos desde el backend."))
    } finally {
      setLoading(false)
    }
  }, [selectedRoleId])

  const loadUserOverrides = useCallback(
    async (userId: string) => {
      if (!userId) return
      setLoadingUserOverrides(true)
      try {
        const payload = await getUserPermissionOverrides(userId)
        setUserGrantsDraft(payload.grants)
        setUserRevokesDraft(payload.revokes)
        setUserBaseline({ grants: payload.grants, revokes: payload.revokes })
      } catch (err) {
        notify({
          title: "No se pudieron cargar excepciones por usuario",
          description: getErrorDescription(err, "Intenta nuevamente en unos segundos."),
          type: "error",
        })
      } finally {
        setLoadingUserOverrides(false)
      }
    },
    [notify],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedRoleId) return
    setDraftPermissions(permissionsByRoleId[selectedRoleId] ?? [])
  }, [permissionsByRoleId, selectedRoleId])

  useEffect(() => {
    if (!selectedUserId) return
    loadUserOverrides(selectedUserId)
  }, [loadUserOverrides, selectedUserId])

  const modules = useMemo(() => {
    return Array.from(new Set(permissions.map((permission) => permission.module))).sort((a, b) => a.localeCompare(b))
  }, [permissions])

  const filteredPermissions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return permissions.filter((permission) => {
      if (moduleFilter !== "all" && permission.module !== moduleFilter) return false
      const action = inferAction(permission.key)
      if (actionFilter !== "all" && action !== actionFilter) return false
      if (!term) return true

      const haystack = [permission.label, permission.description ?? "", permission.module, permission.key]
        .join(" ")
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [actionFilter, moduleFilter, permissions, search])

  const filteredInternalUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase()
    if (!term) return internalUsers.slice(0, 12)
    return internalUsers
      .filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(term))
      .slice(0, 12)
  }, [internalUsers, userSearch])

  useEffect(() => {
    setComboboxActiveIndex(0)
  }, [userSearch])

  const selectedPermissionSet = useMemo(() => new Set(draftPermissions), [draftPermissions])
  const selectedCount = selectedPermissionSet.size
  const hasUnsavedChanges = useMemo(() => {
    const current = new Set(permissionsByRoleId[selectedRoleId] ?? [])
    if (current.size !== selectedPermissionSet.size) return true
    for (const item of selectedPermissionSet) {
      if (!current.has(item)) return true
    }
    return false
  }, [permissionsByRoleId, selectedPermissionSet, selectedRoleId])

  const userOverrideModeByKey = useMemo(() => {
    const mode = new Map<string, "inherit" | "grant" | "revoke">()
    for (const key of userGrantsDraft) mode.set(key, "grant")
    for (const key of userRevokesDraft) mode.set(key, "revoke")
    return mode
  }, [userGrantsDraft, userRevokesDraft])

  const hasUnsavedUserOverrides = useMemo(() => {
    if (!userBaseline) return false
    const sort = (items: string[]) => [...items].sort((a, b) => a.localeCompare(b))
    const aGrants = sort(userBaseline.grants)
    const aRevokes = sort(userBaseline.revokes)
    const bGrants = sort(userGrantsDraft)
    const bRevokes = sort(userRevokesDraft)
    return (
      aGrants.length !== bGrants.length ||
      aRevokes.length !== bRevokes.length ||
      aGrants.some((value, index) => value !== bGrants[index]) ||
      aRevokes.some((value, index) => value !== bRevokes[index])
    )
  }, [userBaseline, userGrantsDraft, userRevokesDraft])

  const togglePermission = (permissionKey: string) => {
    if (!canWriteRoles) return
    setDraftPermissions((current) => {
      const next = new Set(current)
      if (next.has(permissionKey)) {
        next.delete(permissionKey)
      } else {
        next.add(permissionKey)
      }
      return Array.from(next)
    })
  }

  const updateUserOverrideMode = (permissionKey: string, mode: "inherit" | "grant" | "revoke") => {
    if (!canWriteRoles) return
    setUserGrantsDraft((current) => {
      const next = current.filter((item) => item !== permissionKey)
      return mode === "grant" ? [...next, permissionKey] : next
    })
    setUserRevokesDraft((current) => {
      const next = current.filter((item) => item !== permissionKey)
      return mode === "revoke" ? [...next, permissionKey] : next
    })
  }

  const syncCurrentUserPermissions = async (roleKey: string) => {
    if (!authUser || authUser.role !== roleKey) return
    try {
      const me = await getMe()
      setPermissions(normalizePermissions(me.permissions))
    } catch {
      // Si falla esta sincronizacion, la actualizacion de permisos de rol ya se aplico en backend.
    }
  }

  const handleSave = async () => {
    if (!selectedRole || !canWriteRoles) return
    setSaving(true)
    try {
      const payload = await updateRolePermissions(selectedRole.id, draftPermissions)
      setPermissionsByRoleId((current) => ({
        ...current,
        [selectedRole.id]: payload.permissions,
      }))
      await syncCurrentUserPermissions(selectedRole.key)
      notify({
        title: t("accessControl.permissionsSaved"),
        description: t("accessControl.permissionsSavedDesc", { role: selectedRole.name }),
        type: "success",
      })
    } catch (err) {
      notify({
        title: "No se pudieron guardar permisos",
        description: getErrorDescription(err, "Verifica permisos y vuelve a intentar."),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetRole = async () => {
    if (!selectedRole || !canWriteRoles) return
    const accepted = await confirm({
      title: t("accessControl.restoreRoleTitle"),
      description: t("accessControl.restoreRoleDesc"),
      confirmLabel: t("accessControl.restore"),
    })
    if (!accepted) return

    setSaving(true)
    try {
      const payload = await resetRolePermissions(selectedRole.id)
      setPermissionsByRoleId((current) => ({
        ...current,
        [selectedRole.id]: payload.permissions,
      }))
      setDraftPermissions(payload.permissions)
      await syncCurrentUserPermissions(selectedRole.key)
      notify({
        title: t("accessControl.roleRestoredTitle"),
        description: t("accessControl.roleRestoredDesc", { role: selectedRole.name }),
        type: "success",
      })
    } catch (err) {
      notify({
        title: "No se pudo restaurar el perfil",
        description: getErrorDescription(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleResetAll = async () => {
    if (!canWriteRoles) return
    const accepted = await confirm({
      title: t("accessControl.restoreAllTitle"),
      description: t("accessControl.restoreAllDesc"),
      confirmLabel: t("accessControl.restoreAll"),
    })
    if (!accepted) return

    setSaving(true)
    try {
      await resetAllRolePermissions()
      await loadData()
      notify({
        title: t("accessControl.configRestoredTitle"),
        description: t("accessControl.configRestoredDesc"),
        type: "success",
      })
    } catch (err) {
      notify({
        title: "No se pudieron restaurar todos los perfiles",
        description: getErrorDescription(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveUserOverrides = async () => {
    if (!selectedUserId || !canWriteRoles) return
    setSaving(true)
    try {
      const payload = await updateUserPermissionOverrides(selectedUserId, userGrantsDraft, userRevokesDraft)
      setUserGrantsDraft(payload.grants)
      setUserRevokesDraft(payload.revokes)
      setUserBaseline({ grants: payload.grants, revokes: payload.revokes })
      notify({
        title: "Excepciones guardadas",
        description: "Se actualizaron permisos individuales para el usuario.",
        type: "success",
      })
      const overrideEvents = await getSecurityAuditEntries({
        action: "users.permissions_overrides",
        limit: 20,
      })
      setOverrideAudit(overrideEvents)
    } catch (err) {
      notify({
        title: "No se pudieron guardar excepciones",
        description: getErrorDescription(err, "Verifica los cambios e intenta nuevamente."),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUserSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (filteredInternalUsers.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setComboboxOpen(true)
      setComboboxActiveIndex((current) => (current + 1) % filteredInternalUsers.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setComboboxOpen(true)
      setComboboxActiveIndex((current) => (current - 1 + filteredInternalUsers.length) % filteredInternalUsers.length)
      return
    }

    if (event.key === "Enter") {
      if (!comboboxOpen) return
      event.preventDefault()
      const selected = filteredInternalUsers[comboboxActiveIndex]
      if (!selected) return
      setSelectedUserId(selected.id)
      setUserSearch(selected.name)
      setComboboxOpen(false)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setComboboxOpen(false)
    }
  }

  if (loading) {
    return <StateMessage variant="loading" title="Cargando perfiles y permisos..." />
  }

  if (error) {
    return <StateMessage variant="error" title="Error cargando control de acceso" description={error} />
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
            <p className="mt-1 max-w-3xl text-sm text-slate-100/90">
              Gestiona permisos por perfil usando la configuracion central del backend.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs text-cyan-100">{t("accessControl.enabledPermissions", { role: selectedRole?.name ?? "-" })}</p>
            <p className="text-2xl font-semibold">{selectedCount}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={t("accessControl.metrics.totalPermissions")}
          value={String(permissions.length)}
          className="border-sky-300/50 bg-sky-100/70 dark:border-sky-700/40 dark:bg-sky-900/25"
        />
        <KpiCard
          label={t("accessControl.metrics.activeRoles")}
          value={String(roles.length)}
          className="border-emerald-300/50 bg-emerald-100/70 dark:border-emerald-700/40 dark:bg-emerald-900/25"
        />
        <KpiCard
          label={t("accessControl.metrics.selectedRole")}
          value={String(selectedCount)}
          className="border-cyan-300/50 bg-cyan-100/70 dark:border-cyan-700/40 dark:bg-cyan-900/25"
        />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setActiveTab("roles")}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            activeTab === "roles"
              ? "border border-primary/40 bg-primary/10 text-foreground"
              : "border border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          Perfiles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("exceptions")}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            activeTab === "exceptions"
              ? "border border-primary/40 bg-primary/10 text-foreground"
              : "border border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          Excepciones por usuario
        </button>
      </section>

      {!canWriteRoles ? (
        <div className="rounded-xl border border-amber-300/70 bg-amber-100/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100">
          {t("accessControl.readOnlyWarning")}
        </div>
      ) : null}

      {activeTab === "roles" ? (
      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("accessControl.roles")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {roles.map((role) => {
              const selected = selectedRoleId === role.id
              const count = (permissionsByRoleId[role.id] ?? []).length
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    selected
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{role.name}</p>
                    <p className="text-xs uppercase tracking-wide opacity-80">{role.key}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{count}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{t("accessControl.permissionsFor", { role: selectedRole?.name ?? "-" })}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setShowTechnicalCodes((current) => !current)}>
                  {showTechnicalCodes ? t("accessControl.hideCodes") : t("accessControl.showCodes")}
                </Button>
                <Button variant="outline" onClick={handleResetRole} disabled={!canWriteRoles || saving || !selectedRole}>
                  {t("accessControl.restoreRole")}
                </Button>
                <Button variant="outline" onClick={handleResetAll} disabled={!canWriteRoles || saving}>
                  {t("accessControl.restoreAll")}
                </Button>
                <Button onClick={handleSave} disabled={!canWriteRoles || saving || !hasUnsavedChanges || !selectedRole}>
                  {saving ? "Guardando..." : t("accessControl.saveChanges")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("accessControl.searchPermissionPlaceholder")}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              />
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              >
                <option value="all">{t("accessControl.allModules")}</option>
                {modules.map((moduleName) => (
                  <option key={moduleName} value={moduleName}>
                    {moduleName}
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value as "all" | "read" | "write")}
                className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              >
                <option value="all">{t("accessControl.readAndWrite")}</option>
                <option value="read">{t("accessControl.readOnlyFilter")}</option>
                <option value="write">{t("accessControl.writeOnlyFilter")}</option>
              </select>
            </div>

            {filteredPermissions.length === 0 ? (
              <StateMessage variant="empty" title={t("accessControl.noMatchingPermissions")} />
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {filteredPermissions.map((permission) => {
                  const checked = selectedPermissionSet.has(permission.key)
                  return (
                    <label key={permission.id} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description ?? permission.module}</p>
                        {showTechnicalCodes ? <p className="text-[11px] text-muted-foreground">{t("accessControl.technicalCode", { code: permission.key })}</p> : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            checked
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
                          }`}
                        >
                          {checked ? t("accessControl.allowed") : t("accessControl.blocked")}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canWriteRoles}
                          onChange={() => togglePermission(permission.key)}
                          className="h-4 w-4 rounded border-border"
                        />
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      ) : null}

      {activeTab === "exceptions" ? (
      <>
      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Excepciones por usuario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="relative">
              <input
                type="search"
                value={userSearch}
                onFocus={() => setComboboxOpen(true)}
                onChange={(event) => {
                  setUserSearch(event.target.value)
                  setComboboxOpen(true)
                }}
                onKeyDown={handleUserSearchKeyDown}
                placeholder="Buscar usuario por nombre, correo o rol..."
                role="combobox"
                aria-expanded={comboboxOpen}
                aria-controls="access-control-user-combobox-list"
                aria-activedescendant={comboboxOpen ? `access-control-user-option-${comboboxActiveIndex}` : undefined}
                className="h-9 w-full rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
              />
              {comboboxOpen ? (
                <div
                  id="access-control-user-combobox-list"
                  role="listbox"
                  className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg"
                >
                  {filteredInternalUsers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No hay usuarios que coincidan con la busqueda.</p>
                  ) : (
                    filteredInternalUsers.map((user, index) => {
                      const selected = user.id === selectedUserId
                      const active = index === comboboxActiveIndex
                      return (
                        <button
                          key={user.id}
                          id={`access-control-user-option-${index}`}
                          role="option"
                          aria-selected={selected}
                          type="button"
                          onMouseEnter={() => setComboboxActiveIndex(index)}
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setUserSearch(user.name)
                            setComboboxOpen(false)
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                            active || selected
                              ? "bg-primary/10 text-foreground"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{user.name}</span>
                          <span className="ml-3 shrink-0 text-xs uppercase">{user.role}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>
            {selectedInternalUser ? (
              <p className="text-xs text-muted-foreground">
                Seleccionado: {selectedInternalUser.name} · {selectedInternalUser.email}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Usa esto para casos puntuales. Ejemplo: un usuario de soporte con permisos extra sin cambiar todo el perfil soporte.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Permisos individuales</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!canWriteRoles || saving || loadingUserOverrides}
                  onClick={() => {
                    if (!userBaseline) return
                    setUserGrantsDraft(userBaseline.grants)
                    setUserRevokesDraft(userBaseline.revokes)
                  }}
                >
                  Revertir
                </Button>
                <Button onClick={handleSaveUserOverrides} disabled={!canWriteRoles || saving || !hasUnsavedUserOverrides || loadingUserOverrides}>
                  {saving ? "Guardando..." : "Guardar excepciones"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUserOverrides ? (
              <StateMessage variant="loading" title="Cargando excepciones del usuario..." />
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {filteredPermissions.map((permission) => {
                  const mode = userOverrideModeByKey.get(permission.key) ?? "inherit"
                  return (
                    <div key={`user-override-${permission.id}`} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description ?? permission.module}</p>
                      </div>
                      <select
                        value={mode}
                        onChange={(event) => updateUserOverrideMode(permission.key, event.target.value as "inherit" | "grant" | "revoke")}
                        disabled={!canWriteRoles}
                        className="h-8 min-w-[110px] rounded-md border border-border bg-background px-2 text-xs text-foreground"
                      >
                        <option value="inherit">Heredar</option>
                        <option value="grant">Permitir</option>
                        <option value="revoke">Bloquear</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Auditoria de excepciones por usuario</h3>
        {overrideAudit.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no hay eventos de excepciones por usuario.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {overrideAudit.slice(0, 8).map((entry) => (
              <div key={entry.id} className="px-3 py-2">
                <p className="text-xs text-foreground">{entry.action}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()} · {entry.actor?.name ?? "Sistema"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      </>
      ) : null}
    </div>
  )
}

export default AccessControlPage
