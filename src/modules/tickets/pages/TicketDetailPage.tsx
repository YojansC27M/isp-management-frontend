import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, CalendarDays, CreditCard, Download, Paperclip, Pencil, Ticket as TicketIcon, Trash2 } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KeyValueSummaryGrid from "@/components/shared/KeyValueSummaryGrid"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { formatTicketAttachmentSize, resolveTicketAttachmentUrl } from "../lib/attachment"
import TicketComments from "../components/TicketComments"
import { addComment, deleteTicket, getTicketById, getTicketComments } from "../services/ticketsApi"
import type { Ticket, TicketComment, TicketCommentVisibility, TicketHistoryEntry } from "../types/ticket"

const statusTone: Record<Ticket["status"], string> = {
  open: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  in_progress: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  waiting: "bg-violet-100 text-violet-800 ring-1 ring-violet-200",
  resolved: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  closed: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
}

const priorityTone: Record<Ticket["priority"], string> = {
  low: "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200",
  medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  high: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
}

const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify, confirm } = useUI()
  const canReadClients = useCan("clients.read")
  const canScheduleVisits = useCan("visits.write")
  const canRegisterPayments = useCan("payments.manual.write")
  const canManageTickets = useCan("tickets.write")
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [history, setHistory] = useState<TicketHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const loadTicket = useCallback(
    async (showLoading = true) => {
      if (!id) return
      if (showLoading) setLoading(true)
      setError("")
      try {
        const [ticketData, commentsData] = await Promise.all([getTicketById(id), getTicketComments(id)])
        setTicket(ticketData)
        setComments(commentsData)
        setHistory(ticketData.history)
      } catch (err) {
        setError(getErrorMessage(err, t("tickets.detail.loadErrorDefault")))
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [id, t],
  )

  useEffect(() => {
    void loadTicket()
  }, [loadTicket])

  const handleAddComment = async (ticketId: string, message: string, visibility: TicketCommentVisibility) => {
    try {
      await addComment(ticketId, message, visibility)
      await loadTicket(false)
    } catch (err) {
      notify({
        title: t("tickets.detail.commentErrorTitle"),
        description: getErrorMessage(err, t("tickets.detail.commentErrorDesc")),
        type: "error",
      })
    }
  }

  const historyItems = useMemo(() => [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [history])

  const handleDelete = async () => {
    if (!ticket || !canManageTickets) return
    const accepted = await confirm({
      title: t("tickets.detail.deleteTitle"),
      description: t("tickets.detail.deleteDescription"),
      confirmLabel: t("tickets.detail.deleteConfirm"),
    })
    if (!accepted) return

    setDeleting(true)
    try {
      await deleteTicket(ticket.id)
      notify({
        title: t("tickets.detail.deleted"),
        type: "success",
      })
      navigate("/tickets")
    } catch (err) {
      notify({
        title: t("tickets.detail.deleteErrorTitle"),
        description: getErrorMessage(err, t("tickets.detail.deleteErrorDesc")),
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("tickets.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("tickets.detail.loadErrorTitle")} description={error} />
  if (!ticket) return <StateMessage variant="empty" title={t("tickets.detail.notFound")} />
  const attachments = ticket.attachments?.length ? ticket.attachments : ticket.attachment ? [ticket.attachment] : []

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("tickets.detail.summary")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{ticket.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">{ticket.clientName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone[ticket.status]}`}>
                {t(`tickets.status.${ticket.status}`)}
              </span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${priorityTone[ticket.priority]}`}>
                {t(`tickets.priority.${ticket.priority}`)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {t(`tickets.category.${ticket.category}`)}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px] lg:grid-cols-2">
            <Button
              className="bg-white text-slate-900 hover:bg-cyan-50"
              disabled={!canReadClients}
              title={!canReadClients ? t("clients.permissionView") : undefined}
              onClick={() => navigate(`/clients/${ticket.clientId}`)}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              {t("tickets.detail.openClient")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManageTickets}
              title={!canManageTickets ? t("tickets.permissionManage") : undefined}
              onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("tickets.detail.edit")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canScheduleVisits}
              title={!canScheduleVisits ? t("visits.permissionCreate") : undefined}
              onClick={() => navigate("/visits/new", { state: { clientId: ticket.clientId, clientName: ticket.clientName } })}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("tickets.detail.openVisit")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canRegisterPayments}
              title={!canRegisterPayments ? t("payments.permissionCreate") : undefined}
              onClick={() => navigate("/payments/new", { state: { clientId: ticket.clientId, clientName: ticket.clientName } })}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("tickets.detail.openPayment")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManageTickets || deleting}
              title={!canManageTickets ? t("tickets.permissionManage") : undefined}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? t("common.loading") : t("tickets.detail.delete")}
            </Button>
            <Button variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("/tickets")}>
              <TicketIcon className="mr-2 h-4 w-4" />
              {t("tickets.detail.back")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("tickets.detail.status")} value={t(`tickets.status.${ticket.status}`)} />
        <KpiCard label={t("tickets.detail.priority")} value={t(`tickets.priority.${ticket.priority}`)} />
        <KpiCard label={t("tickets.detail.commentCount")} value={String(comments.length)} />
        <KpiCard label={t("tickets.detail.historyCount")} value={String(ticket.history.length)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <KeyValueSummaryGrid
          items={[
            { label: t("tickets.detail.category"), value: t(`tickets.category.${ticket.category}`) },
            { label: t("tickets.detail.owner"), value: ticket.assignedUserName || t("tickets.unassigned") },
            { label: t("tickets.detail.technician"), value: ticket.assignedTechnicianName || t("tickets.unassigned") },
            { label: t("tickets.detail.created"), value: ticket.createdAt },
            { label: t("tickets.table.client"), value: ticket.clientName },
            { label: t("tickets.detail.status"), value: t(`tickets.status.${ticket.status}`) },
          ]}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("tickets.detail.summary")}</CardTitle>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[ticket.status]}`}>
              {t(`tickets.status.${ticket.status}`)}
            </span>
          </CardHeader>
          <CardContent className="grid gap-3">
            <article className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("tickets.table.title")}</p>
              <p className="mt-1 text-sm text-foreground">{ticket.title}</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("tickets.form.description")}</p>
              <p className="mt-1 text-sm text-foreground">{ticket.description}</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("tickets.detail.owner")}</p>
              <p className="mt-1 text-sm text-foreground">{ticket.assignedUserName || t("tickets.unassigned")}</p>
            </article>
            {attachments.length > 0 ? (
              <article className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("tickets.detail.attachment")}</p>
                    <span className="text-xs text-muted-foreground">{attachments.length}</span>
                  </div>
                  <div className="grid gap-3">
                    {attachments.map((attachment) => {
                      const attachmentUrl = resolveTicketAttachmentUrl(attachment.url)
                      const isImage = attachment.mimeType.startsWith("image/")

                      return (
                        <div key={attachment.fileName} className="rounded-xl border border-border/60 bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{attachment.originalName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t("tickets.detail.attachmentType")}: {attachment.mimeType}
                                {" - "}
                                {t("tickets.detail.attachmentSize")}: {formatTicketAttachmentSize(attachment.sizeBytes)}
                              </p>
                            </div>
                            <a
                              href={attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground hover:bg-muted/50"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t("tickets.detail.attachmentDownload")}
                            </a>
                          </div>
                          {isImage ? (
                            <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-background">
                              <img src={attachmentUrl} alt={attachment.originalName} className="h-56 w-full object-cover" />
                            </div>
                          ) : (
                            <div className="mt-3 flex h-24 items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 text-sm text-muted-foreground">
                              <Paperclip className="h-5 w-5" />
                              <span>{attachment.originalName}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </article>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("tickets.detail.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {historyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("tickets.detail.historyEmpty")}</p>
            ) : (
              <ul className="grid gap-2">
                {historyItems.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-muted/30 px-3 py-2">
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.createdAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <TicketComments ticketId={ticket.id} comments={comments} onAddComment={handleAddComment} canComment={canManageTickets} />
      </section>
    </div>
  )
}

export default TicketDetailPage
