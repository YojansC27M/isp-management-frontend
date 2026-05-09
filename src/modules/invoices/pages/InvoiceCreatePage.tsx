import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import InvoiceForm from "../components/InvoiceForm"
import { createInvoice } from "../services/invoicesApi"
import type { InvoiceFormValues } from "../types/invoice"

interface InvoiceCreateLocationState {
  clientId?: string
  clientName?: string
  invoiceNumber?: string
}

const initialValues: InvoiceFormValues = {
  clientId: "",
  invoiceNumber: "",
  amount: 0,
  issueDate: "",
  dueDate: "",
  status: "pending",
}

const InvoiceCreatePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { notify } = useUI()
  const state = location.state as InvoiceCreateLocationState | null

  const formInitialValues = useMemo<InvoiceFormValues>(
    () => ({
      ...initialValues,
      clientId: state?.clientId ?? initialValues.clientId,
      invoiceNumber: state?.invoiceNumber ?? initialValues.invoiceNumber,
    }),
    [state?.clientId, state?.invoiceNumber],
  )

  const handleSubmit = async (values: InvoiceFormValues) => {
    try {
      const created = await createInvoice(values)
      notify({
        title: t("invoices.create.successTitle"),
        description: t("invoices.create.successDescription"),
        type: "success",
      })
      navigate(`/invoices/${created.id}`)
    } catch (err) {
      notify({
        title: t("invoices.create.errorTitle"),
        description: getErrorMessage(err, t("invoices.create.errorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("invoices.create.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("invoices.create.description")}</p>
          {state?.clientName ? <p className="mt-2 text-sm font-medium text-primary">{state.clientName}</p> : null}
        </div>
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("invoices.detail.back")}
        </Button>
      </header>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-semibold">{t("invoices.create.noticeTitle")}</p>
        <p className="mt-1">{t("invoices.create.noticeDescription")}</p>
      </div>

      <InvoiceForm initialValues={formInitialValues} onSubmit={handleSubmit} submitLabel={t("invoices.create.submit")} />
    </div>
  )
}

export default InvoiceCreatePage
