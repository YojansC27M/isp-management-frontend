import { useState } from "react"
import type { CSSProperties, FormEvent } from "react"
import type { TicketComment } from "../types/ticket"

interface TicketCommentsProps {
  ticketId: string
  comments: TicketComment[]
  onAddComment: (ticketId: string, message: string) => Promise<void>
}

const inputStyle: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
}

const TicketComments = ({ ticketId, comments, onAddComment }: TicketCommentsProps) => {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    try {
      await onAddComment(ticketId, message.trim())
      setMessage("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ marginBottom: 8 }}>Comments</h3>
        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
            {comments.map((comment) => (
              <li key={comment.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: 0, fontSize: 14 }}>{comment.message}</p>
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  {comment.author} • {comment.createdAt}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label style={{ fontSize: 13 }}>Add a comment</label>
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          style={inputStyle}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Submit Comment"}
        </button>
      </form>
    </div>
  )
}

export default TicketComments
