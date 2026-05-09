import { useLocation, useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import PaymentForm from "../components/PaymentForm"
import { createPayment } from "../services/paymentsApi"
import type { PaymentFormValues } from "../types/payment"

const initialValues: PaymentFormValues = {
  clientId: "",
  invoiceNumber: "",
  amount: 0,
  paymentMethod: "cash",
  paymentDate: "",
  status: "pending",
}

interface PaymentCreateLocationState {
  clientId?: string
  clientName?: string
  invoiceNumber?: string
}

const PaymentCreatePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { notify } = useUI()
  const state = location.state as PaymentCreateLocationState | null

  const formInitialValues = useMemo<PaymentFormValues>(
    () => ({
      ...initialValues,
      clientId: state?.clientId ?? initialValues.clientId,
      invoiceNumber: state?.invoiceNumber ?? initialValues.invoiceNumber,
    }),
    [state?.clientId, state?.invoiceNumber],
  )

  const handleSubmit = async (values: PaymentFormValues) => {
    try {
      await createPayment(values)
      notify({
        title: t("payments.createSuccessTitle"),
        description: t("payments.createSuccessDescription"),
        type: "success",
      })
      navigate("/payments")
    } catch (err) {
      notify({
        title: t("payments.loadErrorTitle"),
        description: getErrorMessage(err, t("payments.loadErrorTitle")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("payments.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("payments.createDescription")}</p>
          {state?.clientName ? <p className="mt-2 text-sm font-medium text-primary">{state.clientName}</p> : null}
          {state?.invoiceNumber ? <p className="mt-1 text-sm text-muted-foreground">{state.invoiceNumber}</p> : null}
        </div>
        <Button variant="outline" onClick={() => navigate("/payments")}>
          {t("payments.backToList")}
        </Button>
      </header>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">{t("payments.manual.noticeTitle")}</p>
        <p className="mt-1">{t("payments.manual.noticeDescription")}</p>
      </div>
      <PaymentForm initialValues={formInitialValues} onSubmit={handleSubmit} submitLabel={t("payments.create")} />
    </div>
  )
}

export default PaymentCreatePage
