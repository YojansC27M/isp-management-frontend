import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import TicketsTable from "../components/TicketsTable"
import { getTickets } from "../services/ticketsApi"
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"

const inputId = (field: string) => `tickets-list-${field}`

const TicketsListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManageTickets = useCan("tickets.write")
  const statusOptions: { label: string; value: TicketStatus }[] = [
    { label: t("tickets.status.open"), value: "open" },
    { label: t("tickets.status.in_progress"), value: "in_progress" },
    { label: t("tickets.status.resolved"), value: "resolved" },
    { label: t("tickets.status.closed"), value: "closed" },
  ]
  const priorityOptions: { label: string; value: TicketPriority }[] = [
    { label: t("tickets.priority.low"), value: "low" },
    { label: t("tickets.priority.medium"), value: "medium" },
    { label: t("tickets.priority.high"), value: "high" },
  ]

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getTickets()
      setTickets(data)
    } catch (err) {
      setError(getErrorMessage(err, t("tickets.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesSearch = [ticket.title, ticket.clientName, ticket.assignedUserName, ticket.assignedTechnicianName]
        .join(" ")
        .toLowerCase()
        .includes(term)
      const matchesStatus = statusFilter ? ticket.status === statusFilter : true
      const matchesPriority = priorityFilter ? ticket.priority === priorityFilter : true
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("tickets.title")}
        description={t("tickets.description")}
        actions={
          <Button
            onClick={() => navigate("/tickets/new")}
            disabled={!canManageTickets}
            title={!canManageTickets ? t("tickets.permissionCreate") : undefined}
          >
            {t("tickets.create")}
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("tickets.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("tickets.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("tickets.filterStatus")}
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("tickets.all")}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("priority")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("tickets.filterPriority")}
            </Label>
            <select
              id={inputId("priority")}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("tickets.all")}</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("tickets.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("tickets.loadErrorTitle")} description={error} />
      ) : filteredTickets.length === 0 ? (
        <StateMessage variant="empty" title={t("tickets.emptyTitle")} />
      ) : (
        <TicketsTable
          tickets={filteredTickets}
          onView={(id) => navigate(`/tickets/${id}`)}
          onEdit={(id) => navigate(`/tickets/${id}`)}
          canManage={canManageTickets}
        />
      )}
    </div>
  )
}

export default TicketsListPage
