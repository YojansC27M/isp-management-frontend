import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import ClientAutocompleteField from "@/modules/clients/components/ClientAutocompleteField"
import type { PaymentFormValues, PaymentMethod, PaymentStatus } from "../types/payment"

interface PaymentFormProps {
  initialValues: PaymentFormValues
  onSubmit: (values: PaymentFormValues) => void
  submitLabel?: string
}

type PaymentFormState = {
  clientId: string
  invoiceNumber: string
  amount: string
  paymentMethod: PaymentMethod | ""
  paymentDate: string
  status: PaymentStatus | ""
}

type FormErrors = Partial<Record<keyof PaymentFormState, string>>
type FocusableField = keyof PaymentFormState

const methodOptions: { key: string; value: PaymentMethod }[] = [
  { key: "payments.form.method.cash", value: "cash" },
  { key: "payments.form.method.transfer", value: "transfer" },
  { key: "payments.form.method.card", value: "card" },
  { key: "payments.form.method.pse", value: "pse" },
]

const statusOptions: { key: string; value: PaymentStatus }[] = [
  { key: "payments.status.pending", value: "pending" },
  { key: "payments.status.paid", value: "paid" },
  { key: "payments.status.overdue", value: "overdue" },
]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `payment-form-${field}`
const errorId = (field: string) => `payment-form-${field}-error`

const PaymentForm = ({ initialValues, onSubmit, submitLabel }: PaymentFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<PaymentFormState>({
    clientId: initialValues.clientId,
    invoiceNumber: initialValues.invoiceNumber,
    amount: initialValues.amount ? String(initialValues.amount) : "",
    paymentMethod: initialValues.paymentMethod,
    paymentDate: initialValues.paymentDate,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      invoiceNumber: initialValues.invoiceNumber,
      amount: initialValues.amount ? String(initialValues.amount) : "",
      paymentMethod: initialValues.paymentMethod,
      paymentDate: initialValues.paymentDate,
      status: initialValues.status,
    })
  }, [initialValues])

  const handleChange = (field: keyof PaymentFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSelectChange = (field: "paymentMethod" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = t("payments.form.error.clientRequired")
    if (!values.invoiceNumber.trim()) nextErrors.invoiceNumber = t("payments.form.error.invoiceRequired")
    const amount = Number(values.amount)
    if (!values.amount || Number.isNaN(amount) || amount <= 0) nextErrors.amount = t("payments.form.error.amount")
    if (!values.paymentMethod) nextErrors.paymentMethod = t("payments.form.error.methodRequired")
    if (!values.paymentDate) nextErrors.paymentDate = t("payments.form.error.dateRequired")
    if (!values.status) nextErrors.status = t("payments.form.error.statusRequired")
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["clientId", "invoiceNumber", "amount", "paymentMethod", "paymentDate", "status"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      clientId: values.clientId.trim(),
      invoiceNumber: values.invoiceNumber.trim(),
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod as PaymentMethod,
      paymentDate: values.paymentDate,
      status: values.status as PaymentStatus,
    })
  }

  const describedBy = (field: keyof PaymentFormState) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("clientId")}>{t("payments.table.client")}</Label>
          <ClientAutocompleteField
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            onSelect={(client) => setValues((current) => ({ ...current, clientId: client?.id ?? "" }))}
            ref={(node) => (fieldRefs.current.clientId = node)}
            ariaInvalid={Boolean(errors.clientId)}
            ariaDescribedBy={describedBy("clientId")}
          />
          {errors.clientId && <span id={errorId("clientId")} className="text-xs text-rose-600" role="alert">{errors.clientId}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("invoiceNumber")}>{t("payments.account.table.invoice")}</Label>
          <Input
            id={inputId("invoiceNumber")}
            name="invoiceNumber"
            value={values.invoiceNumber}
            onChange={handleChange("invoiceNumber")}
            ref={(node) => (fieldRefs.current.invoiceNumber = node)}
            aria-invalid={Boolean(errors.invoiceNumber)}
            aria-describedby={describedBy("invoiceNumber")}
          />
          {errors.invoiceNumber && <span id={errorId("invoiceNumber")} className="text-xs text-rose-600" role="alert">{errors.invoiceNumber}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("amount")}>{t("payments.table.amount")}</Label>
          <Input
            id={inputId("amount")}
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            onChange={handleChange("amount")}
            ref={(node) => (fieldRefs.current.amount = node)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("amount")}
          />
          {errors.amount && <span id={errorId("amount")} className="text-xs text-rose-600" role="alert">{errors.amount}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("paymentMethod")}>{t("payments.table.method")}</Label>
          <select
            id={inputId("paymentMethod")}
            name="paymentMethod"
            value={values.paymentMethod}
            onChange={handleSelectChange("paymentMethod")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.paymentMethod = node)}
            aria-invalid={Boolean(errors.paymentMethod)}
            aria-describedby={describedBy("paymentMethod")}
          >
            <option value="">{t("payments.form.selectMethod")}</option>
            {methodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.paymentMethod && <span id={errorId("paymentMethod")} className="text-xs text-rose-600" role="alert">{errors.paymentMethod}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("paymentDate")}>{t("payments.table.date")}</Label>
          <Input
            id={inputId("paymentDate")}
            name="paymentDate"
            type="date"
            value={values.paymentDate}
            onChange={handleChange("paymentDate")}
            ref={(node) => (fieldRefs.current.paymentDate = node)}
            aria-invalid={Boolean(errors.paymentDate)}
            aria-describedby={describedBy("paymentDate")}
          />
          {errors.paymentDate && <span id={errorId("paymentDate")} className="text-xs text-rose-600" role="alert">{errors.paymentDate}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("payments.table.status")}</Label>
          <select
            id={inputId("status")}
            name="status"
            value={values.status}
            onChange={handleSelectChange("status")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.status = node)}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={describedBy("status")}
          >
            <option value="">{t("payments.form.selectStatus")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel ?? t("common.save")}</Button>
      </div>
    </form>
  )
}

export default PaymentForm
