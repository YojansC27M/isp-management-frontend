import DataTableShell from "@/components/shared/DataTableShell"
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket"

interface TicketsTableProps {
  tickets: Ticket[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  canManage: boolean
}

const statusClasses: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-muted text-muted-foreground",
}

const priorityClasses: Record<TicketPriority, string> = {
  low: "bg-cyan-100 text-cyan-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
}

const categoryLabel = (value: Ticket["category"]) => {
  if (value === "technical") return "Tecnico"
  if (value === "billing") return "Facturacion"
  return "Instalacion"
}

const TicketsTable = ({ tickets, onView, onEdit, canManage }: TicketsTableProps) => {
  return (
    <DataTableShell>
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Titulo</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Responsable</th>
              <th className="px-4 py-3 font-semibold">Tecnico asignado</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Prioridad</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Creado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{ticket.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.clientName}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.assignedUserName || "Sin asignar"}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.assignedTechnicianName || "Sin asignar"}</td>
                <td className="px-4 py-3 text-muted-foreground">{categoryLabel(ticket.category)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[ticket.status]}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                      onClick={() => onView(ticket.id)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onEdit(ticket.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para gestionar tickets." : undefined}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </DataTableShell>
  )
}

export default TicketsTable
