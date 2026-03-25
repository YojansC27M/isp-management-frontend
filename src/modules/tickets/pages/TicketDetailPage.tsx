import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import TicketComments from "../components/TicketComments"
import { addComment, getTicketById } from "../services/ticketsApi"
import type { Ticket, TicketComment } from "../types/ticket"

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getTicketById(id)
        setTicket(data)
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [id])

  const handleAddComment = async (ticketId: string, message: string) => {
    await addComment(ticketId, message)
    const newComment: TicketComment = {
      id: `${Date.now()}`,
      ticketId,
      message,
      createdAt: new Date().toISOString(),
      author: "You",
    }
    setComments((current) => [newComment, ...current])
    window.alert("Comment added successfully.")
  }

  const statusLabel = useMemo(() => {
    if (!ticket) return ""
    return ticket.status.replace("_", " ")
  }, [ticket])

  if (loading) {
    return <p>Loading ticket...</p>
  }

  if (!ticket) {
    return <p>Ticket not found.</p>
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>{ticket.title}</h1>
        <p style={{ color: "#6b7280" }}>{ticket.clientName}</p>
        <button type="button" onClick={() => navigate("/tickets")} style={{ width: "fit-content" }}>
          Back to Tickets
        </button>
      </header>

      <section style={{ display: "grid", gap: 8 }}>
        <p style={{ margin: 0 }}>{ticket.description}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 13, color: "#6b7280" }}>
          <span>Status: {statusLabel}</span>
          <span>Priority: {ticket.priority}</span>
          <span>Category: {ticket.category}</span>
          <span>Created: {ticket.createdAt}</span>
        </div>
      </section>

      <TicketComments ticketId={ticket.id} comments={comments} onAddComment={handleAddComment} />
    </div>
  )
}

export default TicketDetailPage
