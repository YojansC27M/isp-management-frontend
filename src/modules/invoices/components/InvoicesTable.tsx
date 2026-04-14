import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
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
  const { t } = useI18n()

  return (
    <DataTableShell>
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.invoice")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.client")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.amount")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.issueDate")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.dueDate")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.status")}</th>
            <th className="px-4 py-3 font-semibold">{t("invoices.table.actions")}</th>
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
                  {t(`invoices.status.${invoice.status}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onView(invoice.id)}
                  >
                    {t("invoices.table.view")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onDownload(invoice)}
                  >
                    {t("invoices.table.downloadPdf")}
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
