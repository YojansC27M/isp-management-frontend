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

const statusOptions: { label: string; value: TicketStatus }[] = [
  { label: "Abierto", value: "open" },
  { label: "En progreso", value: "in_progress" },
  { label: "Resuelto", value: "resolved" },
  { label: "Cerrado", value: "closed" },
]

const priorityOptions: { label: string; value: TicketPriority }[] = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
]

const inputId = (field: string) => `tickets-list-${field}`

const TicketsListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManageTickets = useCan("tickets.write")

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getTickets()
      setTickets(data)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar los tickets."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesSearch = [ticket.title, ticket.clientName, ticket.assignedTechnicianName].join(" ").toLowerCase().includes(term)
      const matchesStatus = statusFilter ? ticket.status === statusFilter : true
      const matchesPriority = priorityFilter ? ticket.priority === priorityFilter : true
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Tickets de soporte"
        description="Gestiona incidencias y seguimiento tecnico."
        actions={
          <Button
            onClick={() => navigate("/tickets/new")}
            disabled={!canManageTickets}
            title={!canManageTickets ? "Tu perfil no tiene permiso para crear tickets." : undefined}
          >
            Crear ticket
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscar
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder="Titulo, cliente o tecnico..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("priority")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prioridad
            </Label>
            <select
              id={inputId("priority")}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todas</option>
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
        <StateMessage variant="loading" title="Cargando tickets..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar tickets" description={error} />
      ) : filteredTickets.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron tickets." />
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
