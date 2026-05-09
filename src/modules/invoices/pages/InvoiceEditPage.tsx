import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import InvoiceForm from "../components/InvoiceForm"
import { getInvoiceById, updateInvoice } from "../services/invoicesApi"
import type { Invoice, InvoiceFormValues } from "../types/invoice"

const toDateInputValue = (value: string) => {
  if (!value) return ""
  const normalized = value.includes("T") ? value : `${value}T00:00:00.000Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

const toFormValues = (invoice: Invoice): InvoiceFormValues => ({
  clientId: invoice.clientId,
  invoiceNumber: invoice.invoiceNumber,
  amount: invoice.amount,
  issueDate: toDateInputValue(invoice.issueDate),
  dueDate: toDateInputValue(invoice.dueDate),
  status: invoice.status,
})

const InvoiceEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
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
        setError(getErrorMessage(err, t("invoices.edit.loadError")))
      } finally {
        setLoading(false)
      }
    }

    void loadInvoice()
  }, [id, t])

  const initialValues = useMemo(() => (invoice ? toFormValues(invoice) : null), [invoice])

  const handleSubmit = async (values: InvoiceFormValues) => {
    if (!id) return
    try {
      const saved = await updateInvoice(id, values)
      notify({
        title: t("invoices.edit.successTitle"),
        description: t("invoices.edit.successDescription"),
        type: "success",
      })
      navigate(`/invoices/${saved.id}`)
    } catch (err) {
      notify({
        title: t("invoices.edit.errorTitle"),
        description: getErrorMessage(err, t("invoices.edit.errorDesc")),
        type: "error",
      })
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("invoices.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("invoices.edit.errorTitle")} description={error} />
  if (!initialValues) return <StateMessage variant="empty" title={t("invoices.edit.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("invoices.edit.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("invoices.edit.description")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/invoices/${id ?? ""}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("invoices.edit.back")}
        </Button>
      </header>

      {invoice?.status === "cancelled" ? (
        <StateMessage variant="empty" title={t("invoices.edit.cancelledTitle")} description={t("invoices.edit.cancelledDescription")} />
      ) : null}

      {initialValues ? (
        <InvoiceForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel={t("invoices.edit.submit")}
          disabled={invoice?.status === "cancelled"}
        />
      ) : null}
    </div>
  )
}

export default InvoiceEditPage
