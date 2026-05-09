import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import TicketForm from "../components/TicketForm"
import { getTicketById, updateTicket } from "../services/ticketsApi"
import type { Ticket, TicketFormValues } from "../types/ticket"

const toFormValues = (ticket: Ticket): TicketFormValues => ({
  clientId: ticket.clientId,
  assignedUserId: ticket.assignedUserId,
  assignedUserName: ticket.assignedUserName,
  assignedTechnicianId: ticket.assignedTechnicianId,
  assignedTechnicianName: ticket.assignedTechnicianName,
  title: ticket.title,
  description: ticket.description,
  category: ticket.category,
  priority: ticket.priority,
  status: ticket.status,
})

const TicketEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadTicket = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const data = await getTicketById(id)
      setTicket(data)
    } catch (err) {
      setError(getErrorMessage(err, t("tickets.edit.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadTicket()
  }, [loadTicket])

  const initialValues = useMemo(() => (ticket ? toFormValues(ticket) : null), [ticket])

  const handleSubmit = async (values: TicketFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateTicket(id, values)
      notify({
        title: t("tickets.edit.success"),
        description: t("tickets.edit.successDesc"),
        type: "success",
      })
      navigate(`/tickets/${updated.id}`)
    } catch (err) {
      notify({
        title: t("tickets.edit.errorTitle"),
        description: getErrorMessage(err, t("tickets.edit.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("tickets.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("tickets.edit.loadErrorTitle")} description={error} />
  if (!ticket || !initialValues) return <StateMessage variant="empty" title={t("tickets.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("tickets.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tickets.editDescription")}</p>
          <p className="mt-2 text-sm font-medium text-primary">{ticket.title}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/tickets/${ticket.id}`)}>
          {t("tickets.edit.back")}
        </Button>
      </header>

      {saving ? <StateMessage variant="loading" title={t("tickets.edit.saving")} /> : null}
      <TicketForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("tickets.edit.save")} allowAttachment={false} />
    </div>
  )
}

export default TicketEditPage
