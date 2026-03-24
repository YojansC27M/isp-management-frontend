import { useEffect, useState } from "react"
import type { ChangeEvent, CSSProperties, FormEvent } from "react"
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

const methodOptions: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "cash" },
  { label: "Transfer", value: "transfer" },
  { label: "Card", value: "card" },
  { label: "PSE", value: "pse" },
]

const statusOptions: { label: string; value: PaymentStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
]

const inputStyle: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
  color: "#111827",
}

const errorStyle: CSSProperties = {
  color: "#dc2626",
  fontSize: 12,
}

const PaymentForm = ({ initialValues, onSubmit, submitLabel = "Save" }: PaymentFormProps) => {
  const [values, setValues] = useState<PaymentFormState>({
    clientId: initialValues.clientId,
    invoiceNumber: initialValues.invoiceNumber,
    amount: initialValues.amount ? String(initialValues.amount) : "",
    paymentMethod: initialValues.paymentMethod,
    paymentDate: initialValues.paymentDate,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})

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
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleSelectChange = (field: "paymentMethod" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!values.clientId.trim()) nextErrors.clientId = "Client ID is required"
    if (!values.invoiceNumber.trim()) nextErrors.invoiceNumber = "Invoice number is required"

    const amount = Number(values.amount)
    if (!values.amount || Number.isNaN(amount) || amount <= 0) {
      nextErrors.amount = "Amount must be greater than 0"
    }

    if (!values.paymentMethod) nextErrors.paymentMethod = "Payment method is required"
    if (!values.paymentDate) nextErrors.paymentDate = "Payment date is required"
    if (!values.status) nextErrors.status = "Status is required"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      clientId: values.clientId.trim(),
      invoiceNumber: values.invoiceNumber.trim(),
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod as PaymentMethod,
      paymentDate: values.paymentDate,
      status: values.status as PaymentStatus,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 520 }}>
      <label style={labelStyle}>
        Client ID
        <input name="clientId" value={values.clientId} onChange={handleChange("clientId")} style={inputStyle} />
        {errors.clientId && <span style={errorStyle}>{errors.clientId}</span>}
      </label>
      <label style={labelStyle}>
        Invoice Number
        <input
          name="invoiceNumber"
          value={values.invoiceNumber}
          onChange={handleChange("invoiceNumber")}
          style={inputStyle}
        />
        {errors.invoiceNumber && <span style={errorStyle}>{errors.invoiceNumber}</span>}
      </label>
      <label style={labelStyle}>
        Amount
        <input
          name="amount"
          type="number"
          min="0"
          step="0.01"
          value={values.amount}
          onChange={handleChange("amount")}
          style={inputStyle}
        />
        {errors.amount && <span style={errorStyle}>{errors.amount}</span>}
      </label>
      <label style={labelStyle}>
        Payment Method
        <select
          name="paymentMethod"
          value={values.paymentMethod}
          onChange={handleSelectChange("paymentMethod")}
          style={inputStyle}
        >
          <option value="">Select method</option>
          {methodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.paymentMethod && <span style={errorStyle}>{errors.paymentMethod}</span>}
      </label>
      <label style={labelStyle}>
        Payment Date
        <input
          name="paymentDate"
          type="date"
          value={values.paymentDate}
          onChange={handleChange("paymentDate")}
          style={inputStyle}
        />
        {errors.paymentDate && <span style={errorStyle}>{errors.paymentDate}</span>}
      </label>
      <label style={labelStyle}>
        Status
        <select name="status" value={values.status} onChange={handleSelectChange("status")} style={inputStyle}>
          <option value="">Select status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && <span style={errorStyle}>{errors.status}</span>}
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}

export default PaymentForm
