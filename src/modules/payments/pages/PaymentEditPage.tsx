import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import PaymentForm from "../components/PaymentForm"
import { getPaymentById, updatePayment } from "../services/paymentsApi"
import type { Payment, PaymentFormValues } from "../types/payment"

const toFormValues = (payment: Payment): PaymentFormValues => ({
  clientId: payment.clientId,
  invoiceNumber: payment.invoiceNumber,
  amount: payment.amount,
  paymentMethod: payment.paymentMethod,
  paymentDate: payment.paymentDate.slice(0, 10),
  status: payment.status,
})

const PaymentEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadPayment = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const data = await getPaymentById(id)
      setPayment(data)
    } catch (err) {
      setError(getErrorMessage(err, t("payments.edit.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadPayment()
  }, [loadPayment])

  const initialValues = useMemo(() => (payment ? toFormValues(payment) : null), [payment])

  const handleSubmit = async (values: PaymentFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updatePayment(id, values)
      notify({
        title: t("payments.edit.success"),
        description: t("payments.edit.successDesc"),
        type: "success",
      })
      navigate(`/payments/detail/${updated.id}`)
    } catch (err) {
      notify({
        title: t("payments.edit.errorTitle"),
        description: getErrorMessage(err, t("payments.edit.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("payments.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("payments.edit.loadErrorTitle")} description={error} />
  if (!payment || !initialValues) return <StateMessage variant="empty" title={t("payments.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("payments.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("payments.editDescription")}</p>
          <p className="mt-2 text-sm font-medium text-primary">{payment.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/payments/detail/${payment.id}`)}>
          {t("payments.edit.back")}
        </Button>
      </header>

      {saving ? <StateMessage variant="loading" title={t("payments.edit.saving")} /> : null}
      <PaymentForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("payments.edit.save")} />
    </div>
  )
}

export default PaymentEditPage
