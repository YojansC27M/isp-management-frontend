import { useEffect, useState } from "react"
import type { ChangeEvent, CSSProperties, FormEvent } from "react"
import type { TicketCategory, TicketFormValues, TicketPriority, TicketStatus } from "../types/ticket"

interface TicketFormProps {
  initialValues: TicketFormValues
  onSubmit: (values: TicketFormValues) => void
  submitLabel?: string
}

type TicketFormState = {
  clientId: string
  title: string
  description: string
  category: TicketCategory | ""
  priority: TicketPriority | ""
  status: TicketStatus | ""
}

type FormErrors = Partial<Record<keyof TicketFormState, string>>

const categoryOptions: { label: string; value: TicketCategory }[] = [
  { label: "Technical", value: "technical" },
  { label: "Billing", value: "billing" },
  { label: "Installation", value: "installation" },
]

const priorityOptions: { label: string; value: TicketPriority }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
]

const statusOptions: { label: string; value: TicketStatus }[] = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
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

const TicketForm = ({ initialValues, onSubmit, submitLabel = "Save" }: TicketFormProps) => {
  const [values, setValues] = useState<TicketFormState>({
    clientId: initialValues.clientId,
    title: initialValues.title,
    description: initialValues.description,
    category: initialValues.category,
    priority: initialValues.priority,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      title: initialValues.title,
      description: initialValues.description,
      category: initialValues.category,
      priority: initialValues.priority,
      status: initialValues.status,
    })
  }, [initialValues])

  const handleChange = (field: keyof TicketFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleSelectChange = (field: "category" | "priority" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!values.clientId.trim()) nextErrors.clientId = "Client ID is required"
    if (!values.title.trim()) nextErrors.title = "Title is required"
    if (!values.description.trim()) nextErrors.description = "Description is required"
    if (!values.category) nextErrors.category = "Category is required"
    if (!values.priority) nextErrors.priority = "Priority is required"
    if (!values.status) nextErrors.status = "Status is required"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      clientId: values.clientId.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category as TicketCategory,
      priority: values.priority as TicketPriority,
      status: values.status as TicketStatus,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 560 }}>
      <label style={labelStyle}>
        Client ID
        <input name="clientId" value={values.clientId} onChange={handleChange("clientId")} style={inputStyle} />
        {errors.clientId && <span style={errorStyle}>{errors.clientId}</span>}
      </label>
      <label style={labelStyle}>
        Title
        <input name="title" value={values.title} onChange={handleChange("title")} style={inputStyle} />
        {errors.title && <span style={errorStyle}>{errors.title}</span>}
      </label>
      <label style={labelStyle}>
        Description
        <textarea
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange("description")}
          style={inputStyle}
        />
        {errors.description && <span style={errorStyle}>{errors.description}</span>}
      </label>
      <label style={labelStyle}>
        Category
        <select name="category" value={values.category} onChange={handleSelectChange("category")} style={inputStyle}>
          <option value="">Select category</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.category && <span style={errorStyle}>{errors.category}</span>}
      </label>
      <label style={labelStyle}>
        Priority
        <select name="priority" value={values.priority} onChange={handleSelectChange("priority")} style={inputStyle}>
          <option value="">Select priority</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.priority && <span style={errorStyle}>{errors.priority}</span>}
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

export default TicketForm
