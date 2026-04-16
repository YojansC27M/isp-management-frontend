import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import TicketComments from "../components/TicketComments"
import { addComment, getTicketById, getTicketComments } from "../services/ticketsApi"
import type { Ticket, TicketComment, TicketCommentVisibility, TicketHistoryEntry } from "../types/ticket"

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
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
        setError(getErrorMessage(err, t("tickets.detail.loadErrorDefault")))
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [id, t])

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
            message: t("tickets.detail.internalNote"),
          },
          ...current,
        ])
      }
    } catch (err) {
      notify({
        title: t("tickets.detail.commentErrorTitle"),
        description: getErrorMessage(err, t("tickets.detail.commentErrorDesc")),
        type: "error",
      })
    }
  }

  const historyItems = useMemo(() => [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [history])

  if (loading) return <StateMessage variant="loading" title={t("tickets.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("tickets.detail.loadErrorTitle")} description={error} />
  if (!ticket) return <StateMessage variant="empty" title={t("tickets.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{ticket.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ticket.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          {t("tickets.detail.back")}
        </Button>
      </header>

      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{ticket.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.status")}: {t(`tickets.status.${ticket.status}`)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.priority")}: {t(`tickets.priority.${ticket.priority}`)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.category")}: {t(`tickets.category.${ticket.category}`)}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.owner")}: {ticket.assignedUserName || t("tickets.unassigned")}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.technician")}: {ticket.assignedTechnicianName || t("tickets.unassigned")}</span>
          <span className="rounded-full bg-muted px-2.5 py-1">{t("tickets.detail.created")}: {ticket.createdAt}</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">{t("tickets.detail.history")}</h3>
        {historyItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("tickets.detail.historyEmpty")}</p>
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
