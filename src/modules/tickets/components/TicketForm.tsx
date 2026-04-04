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
  { label: "Técnico", value: "technical" },
  { label: "Facturación", value: "billing" },
  { label: "Instalación", value: "installation" },
]

const priorityOptions: { label: string; value: TicketPriority }[] = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
]

const statusOptions: { label: string; value: TicketStatus }[] = [
  { label: "Abierto", value: "open" },
  { label: "En progreso", value: "in_progress" },
  { label: "Resuelto", value: "resolved" },
  { label: "Cerrado", value: "closed" },
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

const TicketForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: TicketFormProps) => {
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

    if (!values.clientId.trim()) nextErrors.clientId = "El ID de cliente es obligatorio"
    if (!values.title.trim()) nextErrors.title = "El título es obligatorio"
    if (!values.description.trim()) nextErrors.description = "La descripción es obligatoria"
    if (!values.category) nextErrors.category = "La categoría es obligatoria"
    if (!values.priority) nextErrors.priority = "La prioridad es obligatoria"
    if (!values.status) nextErrors.status = "El estado es obligatorio"

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
        ID de cliente
        <input name="clientId" value={values.clientId} onChange={handleChange("clientId")} style={inputStyle} />
        {errors.clientId && <span style={errorStyle}>{errors.clientId}</span>}
      </label>
      <label style={labelStyle}>
        Título
        <input name="title" value={values.title} onChange={handleChange("title")} style={inputStyle} />
        {errors.title && <span style={errorStyle}>{errors.title}</span>}
      </label>
      <label style={labelStyle}>
        Descripción
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
        Categoría
        <select name="category" value={values.category} onChange={handleSelectChange("category")} style={inputStyle}>
          <option value="">Selecciona una categoría</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.category && <span style={errorStyle}>{errors.category}</span>}
      </label>
      <label style={labelStyle}>
        Prioridad
        <select name="priority" value={values.priority} onChange={handleSelectChange("priority")} style={inputStyle}>
          <option value="">Selecciona una prioridad</option>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.priority && <span style={errorStyle}>{errors.priority}</span>}
      </label>
      <label style={labelStyle}>
        Estado
        <select name="status" value={values.status} onChange={handleSelectChange("status")} style={inputStyle}>
          <option value="">Selecciona un estado</option>
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
