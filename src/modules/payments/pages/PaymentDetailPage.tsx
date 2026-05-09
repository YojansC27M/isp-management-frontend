import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, CreditCard, Landmark, Pencil, Trash2 } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KeyValueSummaryGrid from "@/components/shared/KeyValueSummaryGrid"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getInvoices } from "@/modules/invoices/services/invoicesApi"
import { deletePayment, getAccountStatusByClient, getPaymentById } from "../services/paymentsApi"
import type { Invoice } from "@/modules/invoices/types/invoice"
import type { AccountStatusItem, Payment } from "../types/payment"

const paymentTone: Record<Payment["status"], string> = {
  pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  paid: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  overdue: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
  refunded: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))

const PaymentDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify, confirm } = useUI()
  const canReadClients = useCan("clients.read")
  const canReadInvoices = useCan("invoices.read")
  const canManagePayments = useCan("payments.manual.write")

  const [payment, setPayment] = useState<Payment | null>(null)
  const [accountStatus, setAccountStatus] = useState<AccountStatusItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const paymentData = await getPaymentById(id)
        const accountData = await getAccountStatusByClient(paymentData.clientId)
        const invoicesData = canReadInvoices ? await getInvoices() : []
        setPayment(paymentData)
        setAccountStatus(accountData)
        setInvoices(invoicesData)
      } catch (err) {
        const message = getErrorMessage(err, t("payments.detail.loadErrorDefault"))
        setError(message)
        notify({
          title: t("payments.detail.loadErrorTitle"),
          description: message,
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [canReadInvoices, id, notify, t])

  const relatedInvoices = useMemo(() => {
    if (!payment) return []
    return invoices.filter((invoice) => invoice.clientId === payment.clientId || invoice.invoiceNumber === payment.invoiceNumber)
  }, [invoices, payment])

  const summary = useMemo(
    () =>
      accountStatus.reduce(
        (acc, item) => {
          if (item.status === "paid") acc.paid += item.amount
          if (item.status === "pending") acc.pending += item.amount
          if (item.status === "overdue") acc.overdue += item.amount
          return acc
        },
        { paid: 0, pending: 0, overdue: 0 },
      ),
    [accountStatus],
  )

  const handleDelete = async () => {
    if (!payment || !canManagePayments) return
    const accepted = await confirm({
      title: t("payments.detail.deleteTitle"),
      description: t("payments.detail.deleteDescription"),
      confirmLabel: t("payments.detail.deleteConfirm"),
    })
    if (!accepted) return

    setDeleting(true)
    try {
      await deletePayment(payment.id)
      notify({
        title: t("payments.detail.deleted"),
        type: "success",
      })
      navigate("/payments")
    } catch (err) {
      notify({
        title: t("payments.detail.deleteErrorTitle"),
        description: getErrorMessage(err, t("payments.detail.deleteErrorDesc")),
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("payments.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("payments.detail.loadErrorTitle")} description={error} />
  if (!payment) return <StateMessage variant="empty" title={t("payments.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("payments.detail.title")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{payment.invoiceNumber}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">{payment.clientName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${paymentTone[payment.status]}`}>
                {t(`payments.status.${payment.status}`)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {payment.paymentMethod.toUpperCase()}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {formatDate(payment.paymentDate)}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[380px] lg:grid-cols-2">
            <Button
              className="bg-white text-slate-900 hover:bg-cyan-50"
              disabled={!canReadClients}
              title={!canReadClients ? t("clients.permissionView") : undefined}
              onClick={() => navigate(`/clients/${payment.clientId}`)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("payments.detail.openClient")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canReadInvoices}
              title={!canReadInvoices ? t("invoices.permissionView") : undefined}
              onClick={() => navigate(`/payments/account-status/${payment.clientId}`, { state: { clientName: payment.clientName } })}
            >
              <Landmark className="mr-2 h-4 w-4" />
              {t("payments.detail.viewAccount")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManagePayments}
              title={!canManagePayments ? t("payments.permissionManage") : undefined}
              onClick={() => navigate(`/payments/detail/${payment.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("payments.detail.edit")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManagePayments || deleting}
              title={!canManagePayments ? t("payments.permissionManage") : undefined}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? t("common.loading") : t("payments.detail.delete")}
            </Button>
            <Button variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("/payments")}>
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              {t("payments.detail.back")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("payments.detail.amount")} value={formatMoney(payment.amount)} />
        <KpiCard label={t("payments.detail.status")} value={t(`payments.status.${payment.status}`)} />
        <KpiCard label={t("payments.detail.method")} value={payment.paymentMethod.toUpperCase()} />
        <KpiCard label={t("payments.detail.date")} value={formatDate(payment.paymentDate)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <KeyValueSummaryGrid
          items={[
            { label: t("payments.detail.client"), value: payment.clientName },
            { label: t("payments.detail.invoice"), value: payment.invoiceNumber },
            { label: t("payments.detail.amount"), value: formatMoney(payment.amount) },
            { label: t("payments.detail.method"), value: payment.paymentMethod.toUpperCase() },
            { label: t("payments.detail.date"), value: formatDate(payment.paymentDate) },
            { label: t("payments.detail.status"), value: t(`payments.status.${payment.status}`) },
          ]}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("payments.detail.summary")}</CardTitle>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentTone[payment.status]}`}>
              {t(`payments.status.${payment.status}`)}
            </span>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard label={t("payments.status.paid")} value={formatMoney(summary.paid)} />
              <KpiCard label={t("payments.status.pending")} value={formatMoney(summary.pending)} />
              <KpiCard label={t("payments.status.overdue")} value={formatMoney(summary.overdue)} />
            </div>
            <p className="text-sm text-muted-foreground">{t("payments.detail.accountStatus")}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{t("payments.detail.relatedInvoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          {relatedInvoices.length > 0 ? (
            <div className="grid gap-3">
              {relatedInvoices.map((invoice) => (
                <article key={invoice.id} className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invoice.issueDate)} · {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatMoney(invoice.amount)}
                      </span>
                      {canReadInvoices ? (
                        <Button type="button" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          {t("payments.detail.openInvoice")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("payments.account.empty")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentDetailPage
