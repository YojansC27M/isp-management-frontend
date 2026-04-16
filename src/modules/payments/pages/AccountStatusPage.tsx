import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import AccountStatusSummary from "../components/AccountStatusSummary"
import { getAccountStatusByClient } from "../services/paymentsApi"
import type { AccountStatusItem, PaymentStatus } from "../types/payment"

interface LocationState {
  clientName?: string
}

const statusClasses: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
}

const AccountStatusPage = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const state = location.state as LocationState | null
  const [items, setItems] = useState<AccountStatusItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadStatus = async () => {
      if (!clientId) return
      setLoading(true)
      try {
        const data = await getAccountStatusByClient(clientId)
        setItems(data)
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
  }, [clientId])

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.status === "pending") acc.totalPending += item.amount
        if (item.status === "paid") acc.totalPaid += item.amount
        if (item.status === "overdue") acc.totalOverdue += item.amount
        return acc
      },
      { totalPending: 0, totalPaid: 0, totalOverdue: 0 },
    )
  }, [items])

  const clientLabel = state?.clientName ? state.clientName : clientId ? `Cliente ${clientId}` : t("payments.account.client")

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("payments.account.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{clientLabel}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/payments")}>
          {t("payments.account.back")}
        </Button>
      </header>

      {loading ? (
        <StateMessage variant="loading" title={t("payments.account.loading")} />
      ) : items.length === 0 ? (
        <StateMessage variant="empty" title={t("payments.account.empty")}
        />
      ) : (
        <>
          <AccountStatusSummary
            totalPending={summary.totalPending}
            totalPaid={summary.totalPaid}
            totalOverdue={summary.totalOverdue}
          />
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t("payments.account.table.invoice")}</th>
                    <th className="px-4 py-3 font-semibold">{t("invoices.table.dueDate")}</th>
                    <th className="px-4 py-3 font-semibold">{t("payments.table.amount")}</th>
                    <th className="px-4 py-3 font-semibold">{t("payments.table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium text-foreground">{item.invoiceNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.dueDate}</td>
                      <td className="px-4 py-3 text-foreground">${item.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[item.status]}`}>
                          {t(`payments.status.${item.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AccountStatusPage
