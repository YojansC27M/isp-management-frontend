import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import TicketsTable from "../components/TicketsTable"
import { getTickets } from "../services/ticketsApi"
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket"

const statusOptions: { label: string; value: TicketStatus }[] = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
]

const priorityOptions: { label: string; value: TicketPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
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
          <h1>Support Tickets</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Track and resolve client issues.</p>
        </div>
        <button type="button" onClick={() => navigate("/tickets/new")}>
          Create Ticket
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by title or client..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 360 }}
        />
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TicketStatus | "")}>
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Priority
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as TicketPriority | "")}>
            <option value="">All</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading tickets...</p>
      ) : filteredTickets.length === 0 ? (
        <p>No tickets found.</p>
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
