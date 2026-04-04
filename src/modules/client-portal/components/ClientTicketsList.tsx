import type { ClientTicket } from "../types/clientPortal"

interface ClientTicketsListProps {
  tickets: ClientTicket[]
}

const ClientTicketsList = ({ tickets }: ClientTicketsListProps) => {
  if (tickets.length === 0) {
    return <p>No se encontraron tickets.</p>
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>{ticket.title}</strong>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            <span style={{ textTransform: "capitalize" }}>{ticket.status}</span> • {ticket.createdAt}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ClientTicketsList

