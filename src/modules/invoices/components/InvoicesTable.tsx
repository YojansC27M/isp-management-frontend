import DataTableShell from "@/components/shared/DataTableShell"
import type { Invoice, InvoiceStatus } from "../types/invoice"

interface InvoicesTableProps {
  invoices: Invoice[]
  onView: (id: string) => void
  onDownload: (invoice: Invoice) => void
}

const statusClasses: Record<InvoiceStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
}

const InvoicesTable = ({ invoices, onView, onDownload }: InvoicesTableProps) => {
  return (
    <DataTableShell>
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Factura</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Monto</th>
              <th className="px-4 py-3 font-semibold">Emisión</th>
              <th className="px-4 py-3 font-semibold">Vencimiento</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{invoice.clientName}</td>
                <td className="px-4 py-3 text-foreground">${invoice.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground">{invoice.issueDate}</td>
                <td className="px-4 py-3 text-muted-foreground">{invoice.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                      onClick={() => onView(invoice.id)}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                      onClick={() => onDownload(invoice)}
                    >
                      Descargar PDF
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

export default InvoicesTable
