import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import StateMessage from "@/components/feedback/StateMessage"
import { clearClientToken } from "@/auth/session"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import ClientPaymentsTable from "../components/ClientPaymentsTable"
import { downloadPaymentReceipt, getPayments } from "../services/clientPortalApi"
import type { ClientPayment } from "../types/clientPortal"

const ClientPaymentsPage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getPayments()
      setPayments(data)
    } catch (err) {
      setError(getErrorMessage(err, t("clientPortal.payments.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleLogout = () => {
    clearClientToken()
    navigate("/client/login")
  }

  const summary = useMemo(() => {
    const total = payments.reduce((acc, payment) => acc + payment.amount, 0)
    const latest = [...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]
    const methods = new Set(payments.map((payment) => payment.method))
    return { total, latest, methods: methods.size }
  }, [payments])

  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(700px_circle_at_100%_0%,rgba(14,165,233,0.12),transparent_50%),radial-gradient(600px_circle_at_50%_100%,rgba(15,23,42,0.08),transparent_55%)] dark:bg-[radial-gradient(900px_circle_at_0%_0%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(700px_circle_at_100%_0%,rgba(14,165,233,0.15),transparent_50%),radial-gradient(600px_circle_at_50%_100%,rgba(15,23,42,0.72),transparent_55%)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-border/70 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{t("clientPortal.payments.title")}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{t("clientPortal.payments.heroTitle")}</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">{t("clientPortal.payments.subtitle")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/client/dashboard")}>
                  {t("clientPortal.backToDashboard")}
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  {t("header.logout")}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-6 py-5 sm:grid-cols-3 sm:px-8">
            {[
              { label: t("clientPortal.payments.metric.total"), value: `$${summary.total.toFixed(2)}`, tone: "from-emerald-500/20 to-teal-500/10" },
              { label: t("clientPortal.payments.metric.methods"), value: summary.methods, tone: "from-sky-500/20 to-cyan-500/10" },
              { label: t("clientPortal.payments.metric.latest"), value: summary.latest?.paymentDate ?? t("clientPortal.payments.noLatestPayment"), tone: "from-violet-500/20 to-indigo-500/10" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-3xl border border-border/60 bg-gradient-to-br px-5 py-4 shadow-sm", item.tone)}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-xl font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-2 border-b border-border/70">
              <CardTitle>{t("clientPortal.payments.sideCardTitle")}</CardTitle>
              <CardDescription>{t("clientPortal.payments.sideCardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6 text-sm text-muted-foreground">
              <p>{t("clientPortal.payments.sideCardTip1")}</p>
              <p>{t("clientPortal.payments.sideCardTip2")}</p>
              <p>{t("clientPortal.payments.sideCardTip3")}</p>
            </CardContent>
          </Card>

          <div>
            {loading ? (
              <StateMessage variant="loading" title={t("clientPortal.payments.loading")} />
            ) : error ? (
              <StateMessage variant="error" title={t("clientPortal.payments.loadErrorTitle")} description={error} />
            ) : (
              <ClientPaymentsTable
                payments={payments}
                onDownloadReceipt={async (paymentId) => {
                  try {
                    await downloadPaymentReceipt(paymentId)
                  } catch (err) {
                    setError(getErrorMessage(err, t("clientPortal.payments.loadErrorDefault")))
                  }
                }}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ClientPaymentsPage
