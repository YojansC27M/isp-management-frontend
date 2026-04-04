import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import TicketsTable from "../components/TicketsTable"
import { getTickets } from "../services/ticketsApi"
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket"

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

const TicketsListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("")
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTickets()
      setTickets(data)
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
      const matchesSearch = [ticket.title, ticket.clientName].join(" ").toLowerCase().includes(term)
      const matchesStatus = statusFilter ? ticket.status === statusFilter : true
      const matchesPriority = priorityFilter ? ticket.priority === priorityFilter : true
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Tickets de soporte</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Gestiona y resuelve incidencias de clientes.</p>
        </div>
        <button type="button" onClick={() => navigate("/tickets/new")}>
          Crear ticket
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Buscar por título o cliente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 360 }}
        />
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Estado
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "")}>
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Prioridad
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | "")}>
            <option value="">Todos</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Cargando tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <p>No se encontraron tickets.</p>
      ) : (
        <TicketsTable
          tickets={filteredTickets}
          onView={(id) => navigate(`/tickets/${id}`)}
          onEdit={(id) => navigate(`/tickets/${id}`)}
        />
      )}
    </div>
  )
}

export default TicketsListPage
