import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import ClientAutocompleteField from "@/modules/clients/components/ClientAutocompleteField"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { InvoiceFormValues, InvoiceStatus } from "../types/invoice"

interface InvoiceFormProps {
  initialValues: InvoiceFormValues
  onSubmit: (values: InvoiceFormValues) => void
  submitLabel?: string
  disabled?: boolean
}

type InvoiceFormState = {
  clientId: string
  invoiceNumber: string
  amount: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus | ""
}

type FormErrors = Partial<Record<keyof InvoiceFormState, string>>

const statusOptions: { labelKey: string; value: InvoiceStatus }[] = [
  { labelKey: "invoices.status.pending", value: "pending" },
  { labelKey: "invoices.status.paid", value: "paid" },
  { labelKey: "invoices.status.overdue", value: "overdue" },
  { labelKey: "invoices.status.cancelled", value: "cancelled" },
]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `invoice-form-${field}`
const errorId = (field: string) => `invoice-form-${field}-error`

const InvoiceForm = ({ initialValues, onSubmit, submitLabel, disabled = false }: InvoiceFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<InvoiceFormState>({
    clientId: initialValues.clientId,
    invoiceNumber: initialValues.invoiceNumber,
    amount: Number.isFinite(initialValues.amount) ? String(initialValues.amount) : "",
    issueDate: initialValues.issueDate,
    dueDate: initialValues.dueDate,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<keyof InvoiceFormState, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      invoiceNumber: initialValues.invoiceNumber,
      amount: Number.isFinite(initialValues.amount) ? String(initialValues.amount) : "",
      issueDate: initialValues.issueDate,
      dueDate: initialValues.dueDate,
      status: initialValues.status,
    })
  }, [initialValues])

  const handleChange = (field: keyof Omit<InvoiceFormState, "status" | "clientId">) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, status: event.target.value as InvoiceStatus | "" }))
  }

  const compareDates = (a: string, b: string) => a && b ? a > b : false

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = t("invoices.form.error.clientRequired")
    if (!values.invoiceNumber.trim()) nextErrors.invoiceNumber = t("invoices.form.error.numberRequired")
    const amount = Number(values.amount)
    if (!values.amount || Number.isNaN(amount) || amount <= 0) nextErrors.amount = t("invoices.form.error.amountRequired")
    if (!values.issueDate) nextErrors.issueDate = t("invoices.form.error.issueDateRequired")
    if (!values.dueDate) nextErrors.dueDate = t("invoices.form.error.dueDateRequired")
    if (values.issueDate && values.dueDate && compareDates(values.dueDate, values.issueDate)) {
      nextErrors.dueDate = t("invoices.form.error.dueDateBeforeIssue")
    }
    if (!values.status) nextErrors.status = t("invoices.form.error.statusRequired")
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: Array<keyof InvoiceFormState> = ["clientId", "invoiceNumber", "amount", "issueDate", "dueDate", "status"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      clientId: values.clientId.trim(),
      invoiceNumber: values.invoiceNumber.trim(),
      amount: Number(values.amount),
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      status: values.status as InvoiceStatus,
    })
  }

  const describedBy = (field: keyof InvoiceFormState) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("clientId")}>{t("invoices.form.client")}</Label>
          <ClientAutocompleteField
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            disabled={disabled}
            ariaInvalid={Boolean(errors.clientId)}
            ariaDescribedBy={describedBy("clientId")}
            onSelect={(client) => setValues((current) => ({ ...current, clientId: client?.id ?? "" }))}
            ref={(node) => (fieldRefs.current.clientId = node)}
          />
          {errors.clientId ? (
            <span id={errorId("clientId")} className="text-xs text-rose-600" role="alert">
              {errors.clientId}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("invoiceNumber")}>{t("invoices.form.number")}</Label>
          <Input
            id={inputId("invoiceNumber")}
            name="invoiceNumber"
            value={values.invoiceNumber}
            disabled={disabled}
            onChange={handleChange("invoiceNumber")}
            ref={(node) => (fieldRefs.current.invoiceNumber = node)}
            aria-invalid={Boolean(errors.invoiceNumber)}
            aria-describedby={describedBy("invoiceNumber")}
          />
          {errors.invoiceNumber ? (
            <span id={errorId("invoiceNumber")} className="text-xs text-rose-600" role="alert">
              {errors.invoiceNumber}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("amount")}>{t("invoices.form.amount")}</Label>
          <Input
            id={inputId("amount")}
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={values.amount}
            disabled={disabled}
            onChange={handleChange("amount")}
            ref={(node) => (fieldRefs.current.amount = node)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("amount")}
          />
          {errors.amount ? (
            <span id={errorId("amount")} className="text-xs text-rose-600" role="alert">
              {errors.amount}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("invoices.form.status")}</Label>
          <select
            id={inputId("status")}
            value={values.status}
            onChange={handleStatusChange}
            disabled={disabled}
            className={selectClass}
            ref={(node) => (fieldRefs.current.status = node)}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={describedBy("status")}
          >
            <option value="">{t("invoices.form.selectStatus")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          {errors.status ? (
            <span id={errorId("status")} className="text-xs text-rose-600" role="alert">
              {errors.status}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("issueDate")}>{t("invoices.form.issueDate")}</Label>
          <Input
            id={inputId("issueDate")}
            name="issueDate"
            type="date"
            value={values.issueDate}
            disabled={disabled}
            onChange={handleChange("issueDate")}
            ref={(node) => (fieldRefs.current.issueDate = node)}
            aria-invalid={Boolean(errors.issueDate)}
            aria-describedby={describedBy("issueDate")}
          />
          {errors.issueDate ? (
            <span id={errorId("issueDate")} className="text-xs text-rose-600" role="alert">
              {errors.issueDate}
            </span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("dueDate")}>{t("invoices.form.dueDate")}</Label>
          <Input
            id={inputId("dueDate")}
            name="dueDate"
            type="date"
            value={values.dueDate}
            disabled={disabled}
            onChange={handleChange("dueDate")}
            ref={(node) => (fieldRefs.current.dueDate = node)}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={describedBy("dueDate")}
          />
          {errors.dueDate ? (
            <span id={errorId("dueDate")} className="text-xs text-rose-600" role="alert">
              {errors.dueDate}
            </span>
          ) : null}
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={disabled}>
          {submitLabel ?? t("common.save")}
        </Button>
      </div>
    </form>
  )
}

export default InvoiceForm
