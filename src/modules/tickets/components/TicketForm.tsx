import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TicketCategory, TicketFormValues, TicketPriority, TicketStatus } from "../types/ticket"

interface TicketFormProps {
  initialValues: TicketFormValues
  onSubmit: (values: TicketFormValues) => void
  submitLabel?: string
}

type TicketFormState = {
  clientId: string
  assignedTechnicianId: string
  assignedTechnicianName: string
  title: string
  description: string
  category: TicketCategory | ""
  priority: TicketPriority | ""
  status: TicketStatus | ""
}

type FormErrors = Partial<Record<keyof TicketFormState, string>>
type FocusableField = keyof TicketFormState

const categoryOptions: { label: string; value: TicketCategory }[] = [
  { label: "Tecnico", value: "technical" },
  { label: "Facturacion", value: "billing" },
  { label: "Instalacion", value: "installation" },
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

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const textareaClass =
  "min-h-28 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `ticket-form-${field}`
const errorId = (field: string) => `ticket-form-${field}-error`

const TicketForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: TicketFormProps) => {
  const [values, setValues] = useState<TicketFormState>({
    clientId: initialValues.clientId,
    assignedTechnicianId: initialValues.assignedTechnicianId,
    assignedTechnicianName: initialValues.assignedTechnicianName,
    title: initialValues.title,
    description: initialValues.description,
    category: initialValues.category,
    priority: initialValues.priority,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      assignedTechnicianId: initialValues.assignedTechnicianId,
      assignedTechnicianName: initialValues.assignedTechnicianName,
      title: initialValues.title,
      description: initialValues.description,
      category: initialValues.category,
      priority: initialValues.priority,
      status: initialValues.status,
    })
  }, [initialValues])

  const handleChange = (field: keyof TicketFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSelectChange = (field: "category" | "priority" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = "El ID de cliente es obligatorio"
    if (!values.assignedTechnicianId.trim()) nextErrors.assignedTechnicianId = "El ID del tecnico es obligatorio"
    if (!values.assignedTechnicianName.trim()) nextErrors.assignedTechnicianName = "El tecnico asignado es obligatorio"
    if (!values.title.trim()) nextErrors.title = "El titulo es obligatorio"
    if (!values.description.trim()) nextErrors.description = "La descripcion es obligatoria"
    if (!values.category) nextErrors.category = "La categoria es obligatoria"
    if (!values.priority) nextErrors.priority = "La prioridad es obligatoria"
    if (!values.status) nextErrors.status = "El estado es obligatorio"
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = [
        "clientId",
        "assignedTechnicianId",
        "assignedTechnicianName",
        "title",
        "description",
        "category",
        "priority",
        "status",
      ]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      clientId: values.clientId.trim(),
      assignedTechnicianId: values.assignedTechnicianId.trim(),
      assignedTechnicianName: values.assignedTechnicianName.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category as TicketCategory,
      priority: values.priority as TicketPriority,
      status: values.status as TicketStatus,
    })
  }

  const describedBy = (field: keyof TicketFormState) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("clientId")}>ID de cliente</Label>
          <Input
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            onChange={handleChange("clientId")}
            ref={(node) => (fieldRefs.current.clientId = node)}
            aria-invalid={Boolean(errors.clientId)}
            aria-describedby={describedBy("clientId")}
          />
          {errors.clientId && <span id={errorId("clientId")} className="text-xs text-rose-600" role="alert">{errors.clientId}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("assignedTechnicianId")}>ID de tecnico</Label>
          <Input
            id={inputId("assignedTechnicianId")}
            name="assignedTechnicianId"
            value={values.assignedTechnicianId}
            onChange={handleChange("assignedTechnicianId")}
            ref={(node) => (fieldRefs.current.assignedTechnicianId = node)}
            aria-invalid={Boolean(errors.assignedTechnicianId)}
            aria-describedby={describedBy("assignedTechnicianId")}
          />
          {errors.assignedTechnicianId && (
            <span id={errorId("assignedTechnicianId")} className="text-xs text-rose-600" role="alert">
              {errors.assignedTechnicianId}
            </span>
          )}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("assignedTechnicianName")}>Tecnico asignado</Label>
          <Input
            id={inputId("assignedTechnicianName")}
            name="assignedTechnicianName"
            value={values.assignedTechnicianName}
            onChange={handleChange("assignedTechnicianName")}
            ref={(node) => (fieldRefs.current.assignedTechnicianName = node)}
            aria-invalid={Boolean(errors.assignedTechnicianName)}
            aria-describedby={describedBy("assignedTechnicianName")}
          />
          {errors.assignedTechnicianName && (
            <span id={errorId("assignedTechnicianName")} className="text-xs text-rose-600" role="alert">
              {errors.assignedTechnicianName}
            </span>
          )}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("title")}>Titulo</Label>
          <Input
            id={inputId("title")}
            name="title"
            value={values.title}
            onChange={handleChange("title")}
            ref={(node) => (fieldRefs.current.title = node)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
          />
          {errors.title && <span id={errorId("title")} className="text-xs text-rose-600" role="alert">{errors.title}</span>}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("description")}>Descripcion</Label>
          <textarea
            id={inputId("description")}
            name="description"
            rows={4}
            value={values.description}
            onChange={handleChange("description")}
            className={textareaClass}
            ref={(node) => (fieldRefs.current.description = node)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description")}
          />
          {errors.description && (
            <span id={errorId("description")} className="text-xs text-rose-600" role="alert">
              {errors.description}
            </span>
          )}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("category")}>Categoria</Label>
          <select
            id={inputId("category")}
            name="category"
            value={values.category}
            onChange={handleSelectChange("category")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.category = node)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describedBy("category")}
          >
            <option value="">Selecciona una categoria</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && <span id={errorId("category")} className="text-xs text-rose-600" role="alert">{errors.category}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("priority")}>Prioridad</Label>
          <select
            id={inputId("priority")}
            name="priority"
            value={values.priority}
            onChange={handleSelectChange("priority")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.priority = node)}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby={describedBy("priority")}
          >
            <option value="">Selecciona una prioridad</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.priority && <span id={errorId("priority")} className="text-xs text-rose-600" role="alert">{errors.priority}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>Estado</Label>
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
            <option value="">Selecciona un estado</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default TicketForm
