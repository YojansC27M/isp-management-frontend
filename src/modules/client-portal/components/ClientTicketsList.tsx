import StateMessage from "@/components/feedback/StateMessage"
import type { ClientTicket } from "../types/clientPortal"

interface ClientTicketsListProps {
  tickets: ClientTicket[]
}

const ClientTicketsList = ({ tickets }: ClientTicketsListProps) => {
  if (tickets.length === 0) {
    return <StateMessage variant="empty" title="No se encontraron tickets." />
  }

  return (
    <section className="grid gap-3">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">{ticket.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="capitalize">{ticket.status}</span> • {ticket.createdAt}
          </p>
        </article>
      ))}
    </section>
  )
}

export default ClientTicketsList
