import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
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
  waiting: "bg-violet-100 text-violet-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-muted text-muted-foreground",
}

const priorityClasses: Record<TicketPriority, string> = {
  low: "bg-cyan-100 text-cyan-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
}

const TicketsTable = ({ tickets, onView, onEdit, canManage }: TicketsTableProps) => {
  const { t } = useI18n()
  const categoryLabel = (value: Ticket["category"]) => {
    if (value === "technical") return t("tickets.category.technical")
    if (value === "billing") return t("tickets.category.billing")
    return t("tickets.category.installation")
  }

  return (
    <DataTableShell>
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.title")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.client")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.assignee")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.technician")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.category")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.priority")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.created")}</th>
              <th className="px-4 py-3 font-semibold">{t("tickets.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{ticket.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.clientName}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.assignedUserName || t("tickets.unassigned")}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.assignedTechnicianName || t("tickets.unassigned")}</td>
                <td className="px-4 py-3 text-muted-foreground">{categoryLabel(ticket.category)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityClasses[ticket.priority]}`}>
                    {t(`tickets.priority.${ticket.priority}`)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[ticket.status]}`}>
                    {t(`tickets.status.${ticket.status}`)}
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
                    {t("tickets.table.view")}
                  </button>
                  <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onEdit(ticket.id)}
                    disabled={!canManage}
                    title={!canManage ? t("tickets.permissionManage") : undefined}
                  >
                    {t("tickets.table.edit")}
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
