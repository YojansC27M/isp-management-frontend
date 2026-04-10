import DataTableShell from "@/components/shared/DataTableShell"
import type { OverdueClient } from "../types/report"

interface OverdueClientsTableProps {
  clients: OverdueClient[]
}

const OverdueClientsTable = ({ clients }: OverdueClientsTableProps) => {
  if (clients.length === 0) return <p className="text-sm text-muted-foreground">No se encontraron clientes vencidos.</p>

  return (
    <DataTableShell>
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Monto vencido</th>
              <th className="px-4 py-3 font-semibold">Días en mora</th>
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
