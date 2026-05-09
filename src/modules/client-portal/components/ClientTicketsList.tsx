import { useMemo } from "react"
import { Paperclip } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import { cn } from "@/lib/utils"
import type { ClientTicket } from "../types/clientPortal"

interface ClientTicketsListProps {
  tickets: ClientTicket[]
}

const statusTone: Record<string, string> = {
  open: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  in_progress: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  waiting: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  resolved: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  closed: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
}

const priorityTone: Record<string, string> = {
  low: "bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:text-cyan-300",
  medium: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  high: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
}

const ClientTicketsList = ({ tickets }: ClientTicketsListProps) => {
  const { t } = useI18n()

  const metrics = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "open").length
    const inProgress = tickets.filter((ticket) => ticket.status === "in_progress").length
    const resolved = tickets.filter((ticket) => ticket.status === "resolved").length
    const highPriority = tickets.filter((ticket) => ticket.priority === "high").length
    return { open, inProgress, resolved, highPriority }
  }, [tickets])

  if (tickets.length === 0) {
    return <StateMessage variant="empty" title={t("clientPortal.tickets.emptyTitle")} description={t("clientPortal.tickets.emptyDescription")} />
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("clientPortal.tickets.metric.open"), value: metrics.open },
          { label: t("clientPortal.tickets.metric.progress"), value: metrics.inProgress },
          { label: t("clientPortal.tickets.metric.resolved"), value: metrics.resolved },
          { label: t("clientPortal.tickets.metric.highPriority"), value: metrics.highPriority },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-3xl border border-border/70 bg-card p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{ticket.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {ticket.createdAt}
                  {ticket.updatedAt ? ` - ${t("clientPortal.tickets.updated")} ${ticket.updatedAt}` : ""}
                </p>
                {ticket.attachments?.length || ticket.attachment ? (
                  <div className="flex flex-wrap gap-2">
                    {(ticket.attachments?.length ? ticket.attachments : ticket.attachment ? [ticket.attachment] : []).map((attachment) => (
                      <p
                        key={attachment.fileName}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {attachment.originalName}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset", statusTone[ticket.status] ?? statusTone.closed)}>
                  {t(`tickets.status.${ticket.status}`)}
                </span>
                {ticket.priority && (
                  <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset", priorityTone[ticket.priority] ?? priorityTone.medium)}>
                    {t(`tickets.priority.${ticket.priority}`)}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.tickets.metric.channel")}</p>
                <p className="mt-1 font-medium text-foreground">{ticket.channel ? t(`clientPortal.tickets.channel.${ticket.channel}`) : t("clientPortal.tickets.channel.web")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.tickets.metric.messages")}</p>
                <p className="mt-1 font-medium text-foreground">{ticket.messageCount ?? 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.tickets.metric.updated")}</p>
                <p className="mt-1 font-medium text-foreground">{ticket.updatedAt ?? t("clientPortal.tickets.notUpdated")}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ClientTicketsList
