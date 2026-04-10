import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { VisitFormValues, VisitStatus, VisitType } from "../types/visit"

interface VisitFormProps {
  initialValues: VisitFormValues
  onSubmit: (values: VisitFormValues) => void
  submitLabel?: string
}

type VisitFormState = {
  clientId: string
  technicianId: string
  zone: string
  type: VisitType | ""
  scheduledDate: string
  scheduledTime: string
  status: VisitStatus | ""
  notes: string
}

type FormErrors = Partial<Record<keyof VisitFormState, string>>
type FocusableField = keyof VisitFormState

const typeOptions: { label: string; value: VisitType }[] = [
  { label: "Instalación", value: "installation" },
  { label: "Mantenimiento", value: "maintenance" },
  { label: "Soporte", value: "support" },
]

const statusOptions: { label: string; value: VisitStatus }[] = [
  { label: "Programada", value: "scheduled" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completada", value: "completed" },
  { label: "Cancelada", value: "canceled" },
]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const textareaClass =
  "min-h-28 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `visit-form-${field}`
const errorId = (field: string) => `visit-form-${field}-error`

const VisitForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: VisitFormProps) => {
  const [values, setValues] = useState<VisitFormState>({
    clientId: initialValues.clientId,
    technicianId: initialValues.technicianId,
    zone: initialValues.zone,
    type: initialValues.type,
    scheduledDate: initialValues.scheduledDate,
    scheduledTime: initialValues.scheduledTime,
    status: initialValues.status,
    notes: initialValues.notes,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      technicianId: initialValues.technicianId,
      zone: initialValues.zone,
      type: initialValues.type,
      scheduledDate: initialValues.scheduledDate,
      scheduledTime: initialValues.scheduledTime,
      status: initialValues.status,
      notes: initialValues.notes,
    })
  }, [initialValues])

  const handleChange = (field: keyof VisitFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSelectChange = (field: "type" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = "El ID de cliente es obligatorio"
    if (!values.technicianId.trim()) nextErrors.technicianId = "El ID del técnico es obligatorio"
    if (!values.zone.trim()) nextErrors.zone = "La zona es obligatoria"
    if (!values.type) nextErrors.type = "El tipo es obligatorio"
    if (!values.scheduledDate) nextErrors.scheduledDate = "La fecha programada es obligatoria"
    if (!values.scheduledTime) nextErrors.scheduledTime = "La hora programada es obligatoria"
    if (!values.status) nextErrors.status = "El estado es obligatorio"
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["clientId", "technicianId", "zone", "type", "scheduledDate", "scheduledTime", "status"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      clientId: values.clientId.trim(),
      technicianId: values.technicianId.trim(),
      zone: values.zone.trim(),
      type: values.type as VisitType,
      scheduledDate: values.scheduledDate,
      scheduledTime: values.scheduledTime,
      status: values.status as VisitStatus,
      notes: values.notes.trim(),
    })
  }

  const describedBy = (field: keyof VisitFormState) => (errors[field] ? errorId(field) : undefined)

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
          <Label htmlFor={inputId("technicianId")}>ID de técnico</Label>
          <Input
            id={inputId("technicianId")}
            name="technicianId"
            value={values.technicianId}
            onChange={handleChange("technicianId")}
            ref={(node) => (fieldRefs.current.technicianId = node)}
            aria-invalid={Boolean(errors.technicianId)}
            aria-describedby={describedBy("technicianId")}
          />
          {errors.technicianId && <span id={errorId("technicianId")} className="text-xs text-rose-600" role="alert">{errors.technicianId}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("zone")}>Zona</Label>
          <Input
            id={inputId("zone")}
            name="zone"
            value={values.zone}
            onChange={handleChange("zone")}
            ref={(node) => (fieldRefs.current.zone = node)}
            aria-invalid={Boolean(errors.zone)}
            aria-describedby={describedBy("zone")}
          />
          {errors.zone && <span id={errorId("zone")} className="text-xs text-rose-600" role="alert">{errors.zone}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("type")}>Tipo</Label>
          <select
            id={inputId("type")}
            name="type"
            value={values.type}
            onChange={handleSelectChange("type")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.type = node)}
            aria-invalid={Boolean(errors.type)}
            aria-describedby={describedBy("type")}
          >
            <option value="">Selecciona un tipo</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.type && <span id={errorId("type")} className="text-xs text-rose-600" role="alert">{errors.type}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("scheduledDate")}>Fecha programada</Label>
          <Input
            id={inputId("scheduledDate")}
            name="scheduledDate"
            type="date"
            value={values.scheduledDate}
            onChange={handleChange("scheduledDate")}
            ref={(node) => (fieldRefs.current.scheduledDate = node)}
            aria-invalid={Boolean(errors.scheduledDate)}
            aria-describedby={describedBy("scheduledDate")}
          />
          {errors.scheduledDate && <span id={errorId("scheduledDate")} className="text-xs text-rose-600" role="alert">{errors.scheduledDate}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("scheduledTime")}>Hora programada</Label>
          <Input
            id={inputId("scheduledTime")}
            name="scheduledTime"
            type="time"
            value={values.scheduledTime}
            onChange={handleChange("scheduledTime")}
            ref={(node) => (fieldRefs.current.scheduledTime = node)}
            aria-invalid={Boolean(errors.scheduledTime)}
            aria-describedby={describedBy("scheduledTime")}
          />
          {errors.scheduledTime && <span id={errorId("scheduledTime")} className="text-xs text-rose-600" role="alert">{errors.scheduledTime}</span>}
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
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("notes")}>Notas</Label>
          <textarea id={inputId("notes")} name="notes" rows={4} value={values.notes} onChange={handleChange("notes")} className={textareaClass} />
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default VisitForm
