import DataTableShell from "@/components/shared/DataTableShell"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import type { Invoice } from "../types/invoice"
import { formatInvoiceAmount, formatInvoiceDate, invoiceStatusTone } from "../lib/invoicePresentation"

interface InvoicesTableProps {
  invoices: Invoice[]
  formatAmount?: (value: number) => string
  formatDate?: (value: string) => string
  downloadingId?: string | null
  canManage?: boolean
  onView: (id: string) => void
  onDownload: (invoice: Invoice) => void
  onEdit?: (id: string) => void
  onCancel?: (id: string) => void
}

const InvoicesTable = ({
  invoices,
  formatAmount,
  formatDate,
  downloadingId,
  canManage = false,
  onView,
  onDownload,
  onEdit,
  onCancel,
}: InvoicesTableProps) => {
  const { t } = useI18n()
  const renderAmount = formatAmount ?? ((value: number) => formatInvoiceAmount(value))
  const renderDate = formatDate ?? ((value: string) => formatInvoiceDate(value))

  return (
    <DataTableShell>
      <table className="w-full min-w-[1024px] border-collapse text-left text-sm">
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
              <td className="px-4 py-3">
                <div className="grid gap-0.5">
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{t("invoices.table.issuedOn", { date: renderDate(invoice.issueDate) })}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{invoice.clientName}</td>
              <td className="px-4 py-3 font-medium text-foreground">{renderAmount(invoice.amount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{renderDate(invoice.issueDate)}</td>
              <td className="px-4 py-3 text-muted-foreground">{renderDate(invoice.dueDate)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${invoiceStatusTone[invoice.status]}`}>
                  {t(`invoices.status.${invoice.status}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => onView(invoice.id)}>
                    {t("invoices.table.view")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2.5 text-xs"
                    disabled={downloadingId === invoice.id}
                    onClick={() => onDownload(invoice)}
                  >
                    {downloadingId === invoice.id ? t("invoices.downloading") : t("invoices.table.downloadPdf")}
                  </Button>
                  {canManage && onEdit ? (
                    <Button type="button" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => onEdit(invoice.id)}>
                      {t("invoices.table.edit")}
                    </Button>
                  ) : null}
                  {canManage && onCancel && invoice.status !== "cancelled" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => onCancel(invoice.id)}
                    >
                      {t("invoices.table.cancel")}
                    </Button>
                  ) : null}
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
