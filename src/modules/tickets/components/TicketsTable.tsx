import type { CSSProperties } from "react"
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket"

interface TicketsTableProps {
  tickets: Ticket[]
  onView: (id: string) => void
  onEdit: (id: string) => void
}

const statusStyles: Record<TicketStatus, CSSProperties> = {
  open: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  in_progress: { backgroundColor: "#fef3c7", color: "#92400e" },
  resolved: { backgroundColor: "#dcfce7", color: "#166534" },
  closed: { backgroundColor: "#e5e7eb", color: "#374151" },
}

const priorityStyles: Record<TicketPriority, CSSProperties> = {
  low: { backgroundColor: "#e0f2fe", color: "#0369a1" },
  medium: { backgroundColor: "#fef3c7", color: "#92400e" },
  high: { backgroundColor: "#fee2e2", color: "#991b1b" },
}

const TicketsTable = ({ tickets, onView, onEdit }: TicketsTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Título</th>
            <th>Cliente</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Creado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{ticket.title}</td>
              <td>{ticket.clientName}</td>
              <td style={{ textTransform: "capitalize" }}>{ticket.category}</td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    ...priorityStyles[ticket.priority],
                  }}
                >
                  {ticket.priority}
                </span>
              </td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    ...statusStyles[ticket.status],
                  }}
                >
                  {ticket.status.replace("_", " ")}
                </span>
              </td>
              <td>{ticket.createdAt}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onView(ticket.id)}>
                  Ver
                </button>
                <button type="button" onClick={() => onEdit(ticket.id)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TicketsTable
