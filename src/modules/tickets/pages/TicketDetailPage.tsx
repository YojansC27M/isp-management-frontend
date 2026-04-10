import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import TicketComments from "../components/TicketComments"
import { addComment, getTicketById, getTicketComments } from "../services/ticketsApi"
import type { Ticket, TicketComment, TicketCommentVisibility, TicketHistoryEntry } from "../types/ticket"

const statusLabel = (value: Ticket["status"]) => {
  if (value === "open") return "Abierto"
  if (value === "in_progress") return "En progreso"
  if (value === "resolved") return "Resuelto"
  return "Cerrado"
}

const categoryLabel = (value: Ticket["category"]) => {
  if (value === "technical") return "Tecnico"
  if (value === "billing") return "Facturacion"
  return "Instalacion"
}

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useUI()
  const canManageTickets = useCan("tickets.write")
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [history, setHistory] = useState<TicketHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const [ticketData, commentsData] = await Promise.all([getTicketById(id), getTicketComments(id)])
        setTicket(ticketData)
        setComments(commentsData)
        setHistory(ticketData.history)
      } catch (err) {
        setError(getErrorMessage(err, "No fue posible cargar el ticket."))
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [id])

  const handleAddComment = async (ticketId: string, message: string, visibility: TicketCommentVisibility) => {
    try {
      await addComment(ticketId, message, visibility)
      const createdAt = new Date().toISOString()
      const newComment: TicketComment = {
        id: `${Date.now()}`,
        ticketId,
        message,
        createdAt,
        author: "Tu",
        visibility,
      }
      setComments((current) => [newComment, ...current])
      if (visibility === "internal") {
        setHistory((current) => [
          {
            id: `h-${Date.now()}`,
            ticketId,
            createdAt,
            message: "Se agrego una nota interna.",
          },
          ...current,
        ])
      }
    } catch (err) {
      notify({
        title: "No se pudo guardar el comentario",
        description: getErrorMessage(err, "Intenta nuevamente."),
        type: "error",
      })
    }
  }

  const historyItems = useMemo(() => [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [history])

  if (loading) return <StateMessage variant="loading" title="Cargando ticket..." />
  if (error) return <StateMessage variant="error" title="Error al cargar ticket" description={error} />
  if (!ticket) return <StateMessage variant="empty" title="Ticket no encontrado." />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{ticket.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ticket.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          Volver a Tickets
        </Button>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{ticket.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">Estado: {statusLabel(ticket.status)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Prioridad: {ticket.priority}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Categoria: {categoryLabel(ticket.category)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Tecnico: {ticket.assignedTechnicianName}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">Creado: {ticket.createdAt}</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Historial del ticket</h3>
        {historyItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No hay cambios registrados.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {historyItems.map((item) => (
              <li key={item.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-sm text-muted-foreground">{item.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.createdAt}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TicketComments ticketId={ticket.id} comments={comments} onAddComment={handleAddComment} canComment={canManageTickets} />
    </div>
  )
}

export default TicketDetailPage
