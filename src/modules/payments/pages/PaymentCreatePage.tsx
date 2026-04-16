import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
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

const PaymentCreatePage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleSubmit = async (values: PaymentFormValues) => {
    await createPayment(values)
    navigate("/payments")
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("payments.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("payments.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/payments")}>
          {t("payments.backToList")}
        </Button>
      </header>
      <PaymentForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("payments.create")} />
    </div>
  )
}

export default PaymentCreatePage
