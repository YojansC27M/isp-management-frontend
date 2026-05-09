import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Ban, TriangleAlert } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import InvoiceSummaryCard from "../components/InvoiceSummaryCard"
import { cancelInvoice, getInvoiceById } from "../services/invoicesApi"
import type { Invoice } from "../types/invoice"

const InvoiceCancelPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const data = await getInvoiceById(id)
        setInvoice(data)
      } catch (err) {
        setError(getErrorMessage(err, t("invoices.cancel.loadError")))
      } finally {
        setLoading(false)
      }
    }

    void loadInvoice()
  }, [id, t])

  const handleCancel = async () => {
    if (!id || !invoice) return
    setSaving(true)
    try {
      const saved = await cancelInvoice(id, { reason })
      notify({
        title: t("invoices.cancel.successTitle"),
        description: t("invoices.cancel.successDescription"),
        type: "success",
      })
      navigate(`/invoices/${saved.id}`)
    } catch (err) {
      notify({
        title: t("invoices.cancel.errorTitle"),
        description: getErrorMessage(err, t("invoices.cancel.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("invoices.cancel.loading")} />
  if (error) return <StateMessage variant="error" title={t("invoices.cancel.errorTitle")} description={error} />
  if (!invoice) return <StateMessage variant="empty" title={t("invoices.cancel.notFound")} />
  if (invoice.status === "cancelled") {
    return <StateMessage variant="empty" title={t("invoices.cancel.alreadyCancelled")} description={invoice.cancellationReason ?? ""} />
  }

  const canSubmit = reason.trim().length >= 8

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("invoices.cancel.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("invoices.cancel.description")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/invoices/${id ?? ""}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("invoices.cancel.back")}
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <InvoiceSummaryCard invoice={invoice} />
        <Card className="border-rose-200 bg-rose-50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-900">
              <TriangleAlert className="h-5 w-5" />
              {t("invoices.cancel.noticeTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-rose-900">{t("invoices.cancel.noticeDescription")}</p>
            <label className="grid gap-1.5">
              <Label htmlFor="invoice-cancel-reason" className="text-xs uppercase tracking-wide text-rose-900/80">
                {t("invoices.cancel.reason")}
              </Label>
              <textarea
                id="invoice-cancel-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={5}
                className="min-h-[120px] rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-rose-400"
                placeholder={t("invoices.cancel.reasonPlaceholder")}
              />
            </label>
            <div className="flex items-center gap-2">
              <Button type="button" className="bg-rose-700 text-white hover:bg-rose-800" onClick={handleCancel} disabled={!canSubmit || saving}>
                <Ban className="mr-2 h-4 w-4" />
                {saving ? t("invoices.cancel.saving") : t("invoices.cancel.confirm")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/invoices/${id ?? ""}`)}>
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InvoiceCancelPage
