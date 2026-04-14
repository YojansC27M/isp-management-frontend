import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import InternalUsersTable from "../components/InternalUsersTable"
import { deleteInternalUser, getInternalUsers } from "../services/internalUsersApi"
import { getTechnicianAssignmentOptions } from "../services/technicianAssignment"
import type { InternalUser, InternalUserRole, InternalUserStatus } from "../types/internalUser"

const inputId = (field: string) => `internal-users-list-${field}`

const InternalUsersListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { notify, confirm } = useUI()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<InternalUserRole | "">("")
  const [statusFilter, setStatusFilter] = useState<InternalUserStatus | "">("")
  const [users, setUsers] = useState<InternalUser[]>([])
  const [loadByTechnicianId, setLoadByTechnicianId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManageInternalUsers = useCan("internal_users.write")
  const actor = useAuthStore((state) => state.user)
  const roleLabels: Record<InternalUserRole, string> = {
    staff: t("internalUsers.role.staff"),
    admin: t("internalUsers.role.admin"),
    technician: t("internalUsers.role.technician"),
    support: t("internalUsers.role.support"),
  }

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [usersData, technicianOptions] = await Promise.all([
        getInternalUsers(),
        getTechnicianAssignmentOptions({}),
      ])
      setUsers(usersData)
      setLoadByTechnicianId(
        technicianOptions.reduce<Record<string, number>>((acc, option) => {
          acc[option.id] = option.currentLoad
          return acc
        }, {}),
      )
    } catch (err) {
      setError(getErrorMessage(err, t("internalUsers.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch = [user.name, user.email, user.phone].join(" ").toLowerCase().includes(term)
      const matchesRole = roleFilter ? user.role === roleFilter : true
      const matchesStatus = statusFilter ? user.status === statusFilter : true
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const handleDelete = async (id: string) => {
    if (!canManageInternalUsers) return
    const accepted = await confirm({
      title: t("internalUsers.deleteTitle"),
      description: t("internalUsers.deleteDescription"),
      confirmLabel: t("internalUsers.deleteConfirm"),
    })
    if (!accepted) return

    try {
      const removed = users.find((user) => user.id === id)
      await deleteInternalUser(id)
      const entry: SecurityAuditEntry = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
        actorName: actor?.name ?? t("internalUsers.localUser"),
        actorRole: actor?.role ?? "admin",
        targetRole: "all",
        action: "internal_user_delete",
        details: t("internalUsers.auditDeletedDetails", { name: removed?.name ?? id }),
      }
      const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
      writeSecurityAudit(nextAudit)
      await loadUsers()
      notify({ title: t("internalUsers.deleted"), type: "success" })
    } catch (err) {
      notify({
        title: t("internalUsers.deleteErrorTitle"),
        description: getErrorMessage(err, "Intenta nuevamente."),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("internalUsers.title")}
        description={t("internalUsers.description")}
        actions={
          <Button
            onClick={() => navigate("/internal-users/new")}
            disabled={!canManageInternalUsers}
            title={!canManageInternalUsers ? t("internalUsers.permissionCreate") : undefined}
          >
            {t("internalUsers.create")}
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("internalUsers.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("role")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.filterRole")}
            </Label>
            <select
              id={inputId("role")}
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as InternalUserRole | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("internalUsers.all")}</option>
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.filterStatus")}
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InternalUserStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("internalUsers.all")}</option>
              <option value="active">{t("internalUsers.status.active")}</option>
              <option value="inactive">{t("internalUsers.status.inactive")}</option>
            </select>
          </label>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("internalUsers.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("internalUsers.loadErrorTitle")} description={error} />
      ) : filteredUsers.length === 0 ? (
        <StateMessage variant="empty" title={t("internalUsers.emptyTitle")} />
      ) : (
        <InternalUsersTable
          users={filteredUsers}
          loadByTechnicianId={loadByTechnicianId}
          canManage={canManageInternalUsers}
          onEdit={(id) => navigate(`/internal-users/${id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default InternalUsersListPage
