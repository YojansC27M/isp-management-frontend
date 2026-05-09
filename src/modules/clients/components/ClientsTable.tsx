import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
import type { Client, ClientStatus } from "../types/client"

interface ClientsTableProps {
  clients: Client[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  canManage: boolean
}

const statusClasses: Record<ClientStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-amber-100 text-amber-800",
  inactive: "bg-muted text-muted-foreground",
}

const ClientsTable = ({ clients, onView, onEdit, onDelete, canManage }: ClientsTableProps) => {
  const { t } = useI18n()

  return (
    <DataTableShell>
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("clients.table.name")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.document")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.phone")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.email")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.plan")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.ip")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.status")}</th>
            <th className="px-4 py-3 font-semibold">{t("clients.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-border/60">
              <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.document}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.plan}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.ipAddress}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[client.status]}`}
                >
                  {t(`clients.status.${client.status}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-sky-200 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50"
                    onClick={() => onView(client.id)}
                  >
                    {t("clients.table.view")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onEdit(client.id)}
                    disabled={!canManage}
                    title={!canManage ? t("clients.permissionEdit") : undefined}
                  >
                    {t("clients.table.edit")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onDelete(client.id)}
                    disabled={!canManage}
                    title={!canManage ? t("clients.permissionDelete") : undefined}
                  >
                    {t("clients.table.delete")}
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

export default ClientsTable
