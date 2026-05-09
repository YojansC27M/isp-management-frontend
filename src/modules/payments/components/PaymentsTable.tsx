import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
import type { Payment, PaymentStatus } from "../types/payment"

interface PaymentsTableProps {
  payments: Payment[]
  formatAmount: (value: number) => string
  formatDate: (value: string) => string
  onViewDetail: (id: string) => void
  onViewStatus: (clientId: string, clientName: string) => void
  onViewInvoice?: (invoiceNumber: string) => void
}

const statusClasses: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
  refunded: "bg-slate-200 text-slate-700",
}

const PaymentsTable = ({ payments, formatAmount, formatDate, onViewDetail, onViewStatus, onViewInvoice }: PaymentsTableProps) => {
  const { t } = useI18n()

  return (
    <DataTableShell>
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("payments.table.client")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.invoice")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.amount")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.method")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.date")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.status")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-t border-border/60">
              <td className="px-4 py-3 font-medium text-foreground">{payment.clientName}</td>
              <td className="px-4 py-3 text-muted-foreground">{payment.invoiceNumber}</td>
              <td className="px-4 py-3 font-semibold text-foreground">{formatAmount(payment.amount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{t(`payments.form.method.${payment.paymentMethod}`)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(payment.paymentDate)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[payment.status]}`}>
                  {t(`payments.status.${payment.status}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onViewDetail(payment.id)}
                  >
                    {t("payments.table.view")}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onViewStatus(payment.clientId, payment.clientName)}
                  >
                    {t("payments.table.viewAccountStatus")}
                  </button>
                  {onViewInvoice ? (
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                      onClick={() => onViewInvoice(payment.invoiceNumber)}
                    >
                      {t("payments.table.viewInvoice")}
                    </button>
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

export default PaymentsTable
