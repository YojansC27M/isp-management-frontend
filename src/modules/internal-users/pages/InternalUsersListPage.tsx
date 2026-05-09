import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import { getErrorDescription, getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import InternalUsersTable from "../components/InternalUsersTable"
import {
  DEFAULT_INTERNAL_USERS_CURSOR_META,
  deleteInternalUser,
  getInternalUsersCursorPageSafe,
} from "../services/internalUsersApi"
import { getTickets } from "@/modules/tickets/services/ticketsApi"
import { getVisits } from "@/modules/visits/services/visitsApi"
import type { InternalUser, InternalUserRole, InternalUserStatus } from "../types/internalUser"

const inputId = (field: string) => `internal-users-list-${field}`

const InternalUsersListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { notify, confirm } = useUI()
  const [searchInput, setSearchInput] = useState("")
  const [roleFilterInput, setRoleFilterInput] = useState<InternalUserRole | "">("")
  const [statusFilterInput, setStatusFilterInput] = useState<InternalUserStatus | "">("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedRoleFilter, setAppliedRoleFilter] = useState<InternalUserRole | "">("")
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<InternalUserStatus | "">("")
  const [users, setUsers] = useState<InternalUser[]>([])
  const [loadByTechnicianId, setLoadByTechnicianId] = useState<Record<string, number>>({})
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [limit, setLimit] = useState(25)
  const [meta, setMeta] = useState(DEFAULT_INTERNAL_USERS_CURSOR_META)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManageInternalUsers = useCan("internal_users.write")
  const canReadTickets = useCan("tickets.read")
  const canReadVisits = useCan("visits.read")
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
      const currentCursor = pageCursors[pageIndex] ?? null
      const response = await getInternalUsersCursorPageSafe({
        search: appliedSearch,
        role: appliedRoleFilter,
        status: appliedStatusFilter,
        cursor: currentCursor ?? undefined,
        limit,
      })
      const usersData = response.items
      setUsers(usersData)
      setMeta(response.meta)

      if (canReadTickets && canReadVisits) {
        const [tickets, visits] = await Promise.all([getTickets(), getVisits()])
        const nextLoadByTechnicianId = usersData
          .filter((user) => user.role === "technician")
          .reduce<Record<string, number>>((acc, technician) => {
            const ticketsLoad = tickets.filter(
              (ticket) =>
                ticket.assignedTechnicianId === technician.id && (ticket.status === "open" || ticket.status === "in_progress"),
            ).length
            const visitsLoad = visits.filter(
              (visit) =>
                visit.technicianId === technician.id && (visit.status === "scheduled" || visit.status === "in_progress"),
            ).length
            acc[technician.id] = ticketsLoad + visitsLoad
            return acc
          }, {})

        setLoadByTechnicianId(nextLoadByTechnicianId)
      } else {
        setLoadByTechnicianId({})
      }
    } catch (err) {
      setError(getErrorMessage(err, t("internalUsers.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [appliedRoleFilter, appliedSearch, appliedStatusFilter, canReadTickets, canReadVisits, limit, pageCursors, pageIndex, t])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const applyFilters = () => {
    setPageCursors([null])
    setPageIndex(0)
    setAppliedSearch(searchInput.trim())
    setAppliedRoleFilter(roleFilterInput)
    setAppliedStatusFilter(statusFilterInput)
  }

  const clearFilters = () => {
    setSearchInput("")
    setRoleFilterInput("")
    setStatusFilterInput("")
    setPageCursors([null])
    setPageIndex(0)
    setAppliedSearch("")
    setAppliedRoleFilter("")
    setAppliedStatusFilter("")
  }

  const handleDelete = async (id: string) => {
    if (!canManageInternalUsers) return
    const accepted = await confirm({
      title: t("internalUsers.deleteTitle"),
      description: t("internalUsers.deleteDescription"),
      confirmLabel: t("internalUsers.deleteConfirm"),
    })
    if (!accepted) return

    try {
      await deleteInternalUser(id)
      await loadUsers()
      notify({ title: t("internalUsers.deleted"), type: "success" })
    } catch (err) {
      notify({
        title: t("internalUsers.deleteErrorTitle"),
        description: getErrorDescription(err, t("internalUsers.deleteErrorDesc")),
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
        <form
          className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            applyFilters()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("internalUsers.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("role")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.filterRole")}
            </Label>
            <select
              id={inputId("role")}
              value={roleFilterInput}
              onChange={(event) => setRoleFilterInput(event.target.value as InternalUserRole | "")}
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
              value={statusFilterInput}
              onChange={(event) => setStatusFilterInput(event.target.value as InternalUserStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("internalUsers.all")}</option>
              <option value="active">{t("internalUsers.status.active")}</option>
              <option value="inactive">{t("internalUsers.status.inactive")}</option>
            </select>
          </label>
          <Button type="submit" className="h-8">
            {t("internalUsers.searchButton")}
          </Button>
          <Button type="button" variant="outline" className="h-8" onClick={clearFilters}>
            {t("internalUsers.clearButton")}
          </Button>
        </form>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("internalUsers.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("internalUsers.loadErrorTitle")} description={error} />
      ) : users.length === 0 ? (
        <StateMessage variant="empty" title={t("internalUsers.emptyTitle")} />
      ) : (
        <div className="grid gap-4">
          <InternalUsersTable
            users={users}
            loadByTechnicianId={loadByTechnicianId}
            canManage={canManageInternalUsers}
            onEdit={(id) => navigate(`/internal-users/${id}/edit`)}
            onDelete={handleDelete}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {t("internalUsers.pagination.cursorSummary", {
                page: pageIndex + 1,
                count: users.length,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-muted-foreground">
                <span>{t("internalUsers.pagination.perPage")}</span>
                <select
                  className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                  value={limit}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    setLimit(Number.isFinite(next) ? next : 25)
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <Button variant="outline" onClick={() => setPageIndex((current) => Math.max(0, current - 1))} disabled={pageIndex === 0}>
                {t("internalUsers.pagination.prev")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!meta.hasNext || !meta.nextCursor) return
                  setPageCursors((current) => {
                    if (pageIndex < current.length - 1) return current
                    return [...current, meta.nextCursor]
                  })
                  setPageIndex((current) => current + 1)
                }}
                disabled={!meta.hasNext || !meta.nextCursor}
              >
                {t("internalUsers.pagination.next")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InternalUsersListPage
