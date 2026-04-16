import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
import type { OverdueClient } from "../types/report"

interface OverdueClientsTableProps {
  clients: OverdueClient[]
}

const OverdueClientsTable = ({ clients }: OverdueClientsTableProps) => {
  const { t } = useI18n()

  if (clients.length === 0) return <p className="text-sm text-muted-foreground">{t("reports.overdueClients.empty")}</p>

  return (
    <DataTableShell>
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("reports.overdueClients.table.client")}</th>
            <th className="px-4 py-3 font-semibold">{t("reports.overdueClients.table.amountDue")}</th>
            <th className="px-4 py-3 font-semibold">{t("reports.overdueClients.table.daysOverdue")}</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-border/60">
              <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
              <td className="px-4 py-3 text-muted-foreground">${client.amountDue.toFixed(2)}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.daysOverdue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  )
}

export default OverdueClientsTable
