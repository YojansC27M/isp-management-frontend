import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Ban, Download, PencilLine, ShieldCheck, UserRound } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
import InvoiceSummaryCard from "../components/InvoiceSummaryCard"
import { downloadInvoicePdf, getInvoiceById } from "../services/invoicesApi"
import { formatInvoiceAmount, formatInvoiceDate, invoiceStatusTone } from "../lib/invoicePresentation"
import type { Invoice } from "../types/invoice"

const defaultCurrency = "COP"

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const { notify } = useUI()
  const canReadClients = useCan("clients.read")
  const canReadReports = useCan("reports.read")
  const canManageInvoices = useCan("invoices.write")
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [currency, setCurrency] = useState(defaultCurrency)

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const [invoiceData, systemSettings] = await Promise.all([
          getInvoiceById(id),
          getSystemSettings().catch(() => null),
        ])
        setInvoice(invoiceData)
        if (systemSettings?.currency?.trim()) {
          setCurrency(systemSettings.currency)
        }
      } catch (err) {
        const message = getErrorMessage(err, t("invoices.detail.loadErrorDefault"))
        setError(message)
        notify({
          title: t("invoices.detail.loadErrorTitle"),
          description: message,
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadInvoice()
  }, [id, notify, t])

  const formatAmount = (value: number) => formatInvoiceAmount(value, currency, locale === "es" ? "es-CO" : "en-US")
  const formatDate = (value: string) => formatInvoiceDate(value, locale === "es" ? "es-CO" : "en-US")

  const handleDownload = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const blob = await downloadInvoicePdf(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoice.invoiceNumber}.pdf`
      link.rel = "noreferrer"
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (err) {
      const message = getErrorMessage(err, t("invoices.downloadErrorDesc"))
      notify({
        title: t("invoices.downloadErrorTitle"),
        description: message,
        type: "error",
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("invoices.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("invoices.detail.loadErrorTitle")} description={error} />
  if (!invoice) return <StateMessage variant="empty" title={t("invoices.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("invoices.detail.heroTag")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{invoice.invoiceNumber}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">{invoice.clientName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${invoiceStatusTone[invoice.status]}`}>
                {t(`invoices.status.${invoice.status}`)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {formatAmount(invoice.amount)}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {t("invoices.detail.dueOn", { date: formatDate(invoice.dueDate) })}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {t("invoices.detail.issuedOn", { date: formatDate(invoice.issueDate) })}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[380px] lg:grid-cols-2">
            <Button className="bg-white text-slate-900 hover:bg-cyan-50" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("invoices.detail.back")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {downloading ? t("invoices.downloading") : t("invoices.detail.download")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canReadClients}
              title={!canReadClients ? t("invoices.detail.clientPermission") : undefined}
              onClick={() => navigate(`/clients/${invoice.clientId}`)}
            >
              <UserRound className="mr-2 h-4 w-4" />
              {t("invoices.detail.openClient")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canReadReports}
              title={!canReadReports ? t("invoices.detail.reportsPermission") : undefined}
              onClick={() => navigate("/reports")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("invoices.detail.openReports")}
            </Button>
            {canManageInvoices && invoice.status !== "cancelled" ? (
              <Button
                variant="outline"
                className="border-white/35 bg-white/5 text-white hover:bg-white/10"
                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              >
                <PencilLine className="mr-2 h-4 w-4" />
                {t("invoices.detail.edit")}
              </Button>
            ) : null}
            {canManageInvoices && invoice.status !== "cancelled" ? (
              <Button
                variant="outline"
                className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                onClick={() => navigate(`/invoices/${invoice.id}/cancel`)}
              >
                <Ban className="mr-2 h-4 w-4" />
                {t("invoices.detail.cancel")}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("invoices.detail.amount")} value={formatAmount(invoice.amount)} />
        <KpiCard label={t("invoices.detail.client")} value={invoice.clientName} />
        <KpiCard label={t("invoices.detail.issueDate")} value={formatDate(invoice.issueDate)} />
        <KpiCard label={t("invoices.detail.dueDate")} value={formatDate(invoice.dueDate)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <InvoiceSummaryCard invoice={invoice} formatAmount={formatAmount} formatDate={formatDate} />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("invoices.detail.securityTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <p>{t("invoices.detail.securityDescription")}</p>
            <ul className="grid gap-2">
              <li>{t("invoices.detail.securityTip1")}</li>
              <li>{t("invoices.detail.securityTip2")}</li>
              <li>{t("invoices.detail.securityTip3")}</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {invoice.status === "cancelled" ? (
        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardHeader>
            <CardTitle>{t("invoices.detail.cancelledTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-slate-700">
            <p>
              {t("invoices.detail.cancelledAt")}{" "}
              {invoice.cancelledAt ? formatDate(invoice.cancelledAt) : t("invoices.detail.noCancellationDate")}
            </p>
            <p>{invoice.cancellationReason ?? t("invoices.detail.noCancellationReason")}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export default InvoiceDetailPage
