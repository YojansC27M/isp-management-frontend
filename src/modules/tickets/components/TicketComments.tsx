import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { TicketComment, TicketCommentVisibility } from "../types/ticket"

interface TicketCommentsProps {
  ticketId: string
  comments: TicketComment[]
  onAddComment: (ticketId: string, message: string, visibility: TicketCommentVisibility) => Promise<void>
  canComment?: boolean
}

const textareaClass =
  "min-h-24 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"

const visibilityLabel: Record<TicketCommentVisibility, string> = {
  public: "Publico",
  internal: "Interno",
}

const visibilityStyles: Record<TicketCommentVisibility, string> = {
  public: "bg-blue-100 text-blue-700",
  internal: "bg-violet-100 text-violet-700",
}

const TicketComments = ({ ticketId, comments, onAddComment, canComment = true }: TicketCommentsProps) => {
  const [message, setMessage] = useState("")
  const [visibility, setVisibility] = useState<TicketCommentVisibility>("public")
  const [filter, setFilter] = useState<TicketCommentVisibility | "all">("all")
  const [submitting, setSubmitting] = useState(false)

  const visibleComments = useMemo(() => {
    if (filter === "all") return comments
    return comments.filter((comment) => comment.visibility === filter)
  }, [comments, filter])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canComment) return
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await onAddComment(ticketId, message.trim(), visibility)
      setMessage("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Comentarios</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setFilter("all")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs ${filter === "public" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setFilter("public")}
            >
              Publicos
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs ${filter === "internal" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              onClick={() => setFilter("internal")}
            >
              Internos
            </button>
          </div>
        </div>
        {visibleComments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No hay comentarios para este filtro.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {visibleComments.map((comment) => (
              <li key={comment.id} className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${visibilityStyles[comment.visibility]}`}>
                    {visibilityLabel[comment.visibility]}
                  </span>
                  <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{comment.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{comment.author}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleSubmit} className="grid gap-2 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-1.5 sm:max-w-xs">
          <Label htmlFor="ticket-comment-visibility">Tipo de comentario</Label>
          <select
            id="ticket-comment-visibility"
            value={visibility}
            disabled={!canComment}
            onChange={(event) => setVisibility(event.target.value as TicketCommentVisibility)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="public">Publico (visible al cliente)</option>
            <option value="internal">Interno (solo equipo)</option>
          </select>
        </div>
        <Label htmlFor="ticket-comment-message">Agregar comentario</Label>
        <textarea
          id="ticket-comment-message"
          rows={3}
          value={message}
          disabled={!canComment}
          onChange={(event) => setMessage(event.target.value)}
          className={textareaClass}
        />
        <div>
          <Button
            type="submit"
            disabled={submitting || !canComment}
            title={!canComment ? "Tu perfil no tiene permiso para comentar en tickets." : undefined}
          >
            {submitting ? "Guardando..." : "Enviar comentario"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default TicketComments
