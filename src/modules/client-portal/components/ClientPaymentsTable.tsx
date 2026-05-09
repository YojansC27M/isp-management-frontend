import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import { cn } from "@/lib/utils"
import type { ClientPayment } from "../types/clientPortal"

interface ClientPaymentsTableProps {
  payments: ClientPayment[]
  onDownloadReceipt: (paymentId: string) => Promise<void>
}

const methodTone: Record<string, string> = {
  card: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  transfer: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  cash: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  pse: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  other: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
}

const statusTone: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  paid: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  overdue: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
}

const ClientPaymentsTable = ({ payments, onDownloadReceipt }: ClientPaymentsTableProps) => {
  const { t } = useI18n()

  const summary = useMemo(() => {
    const total = payments.reduce((acc, payment) => acc + payment.amount, 0)
    const latest = [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]
    const pending = payments.filter((payment) => payment.status === "pending").length
    return { total, latest, pending }
  }, [payments])

  if (payments.length === 0) {
    return <StateMessage variant="empty" title={t("clientPortal.payments.emptyTitle")} description={t("clientPortal.payments.emptyDescription")} />
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.payments.metric.total")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">${summary.total.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.payments.metric.latest")}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{summary.latest?.paymentDate ?? t("clientPortal.payments.noLatestPayment")}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.payments.metric.pending")}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.pending}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t("clientPortal.payments.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("clientPortal.payments.subtitle")}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-[0.25em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">{t("payments.table.amount")}</th>
                <th className="px-5 py-3 font-semibold">{t("payments.table.date")}</th>
                <th className="px-5 py-3 font-semibold">{t("payments.table.method")}</th>
                <th className="px-5 py-3 font-semibold">{t("payments.table.status")}</th>
                <th className="px-5 py-3 font-semibold">{t("payments.table.invoice")}</th>
                <th className="px-5 py-3 font-semibold">{t("clientPortal.payments.reference")}</th>
                <th className="px-5 py-3 font-semibold">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const paymentStatus = payment.status ?? "paid"
                return (
                  <tr key={payment.id} className="border-t border-border/60">
                    <td className="px-5 py-4 font-medium text-foreground">${payment.amount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{payment.paymentDate}</td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset", methodTone[payment.method] ?? methodTone.other)}>
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset", statusTone[paymentStatus] ?? statusTone.paid)}>
                        {t(`payments.status.${paymentStatus}`)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{payment.invoiceNumber ?? "-"}</td>
                    <td className="px-5 py-4 text-muted-foreground">{payment.reference ?? "-"}</td>
                    <td className="px-5 py-4">
                      <Button variant="outline" size="sm" onClick={() => onDownloadReceipt(payment.id)}>
                        Descargar
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default ClientPaymentsTable
