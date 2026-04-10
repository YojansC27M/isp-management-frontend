import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ClientFormValues, ClientStatus } from "../types/client"

interface ClientFormProps {
  initialValues: ClientFormValues
  onSubmit: (values: ClientFormValues) => void
  submitLabel?: string
}

type FormErrors = Partial<Record<keyof ClientFormValues, string>>
type FocusableField = keyof ClientFormValues

const statusOptions: { label: string; value: ClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Inactivo", value: "inactive" },
]

const fieldClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const errorId = (field: string) => `client-form-${field}-error`
const inputId = (field: string) => `client-form-${field}`

const ClientForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: ClientFormProps) => {
  const [values, setValues] = useState<ClientFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function setFieldValue<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleTextChange = (field: keyof ClientFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(field, event.target.value as ClientFormValues[typeof field])
  }

  const handleSelectChange = (field: "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setFieldValue(field, event.target.value as ClientStatus)
  }

  const handleNumberChange = (field: "latitude" | "longitude") => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFieldValue(field, value === "" ? null : Number(value))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio"
    if (!values.document.trim()) nextErrors.document = "El documento es obligatorio"
    if (!values.phone.trim()) nextErrors.phone = "El teléfono es obligatorio"
    if (!values.email.trim()) {
      nextErrors.email = "El correo es obligatorio"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "El correo no es válido"
    }
    if (!values.ipAddress.trim()) nextErrors.ipAddress = "La IP es obligatoria"
    if (!values.status) nextErrors.status = "El estado es obligatorio"
    setErrors(nextErrors)
    return nextErrors
  }

  const focusFirstError = (nextErrors: FormErrors) => {
    const order: FocusableField[] = ["name", "document", "phone", "email", "ipAddress", "status"]
    const first = order.find((field) => nextErrors[field])
    if (!first) return
    fieldRefs.current[first]?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }
    onSubmit(values)
  }

  const describedBy = (field: keyof ClientFormValues) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("name")}>Nombre</Label>
          <Input
            id={inputId("name")}
            name="name"
            value={values.name}
            onChange={handleTextChange("name")}
            ref={(node) => (fieldRefs.current.name = node)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
          />
          {errors.name && <span id={errorId("name")} className="text-xs text-rose-600" role="alert">{errors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("document")}>Documento</Label>
          <Input
            id={inputId("document")}
            name="document"
            value={values.document}
            onChange={handleTextChange("document")}
            ref={(node) => (fieldRefs.current.document = node)}
            aria-invalid={Boolean(errors.document)}
            aria-describedby={describedBy("document")}
          />
          {errors.document && <span id={errorId("document")} className="text-xs text-rose-600" role="alert">{errors.document}</span>}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("address")}>Dirección</Label>
          <Input id={inputId("address")} name="address" value={values.address} onChange={handleTextChange("address")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("phone")}>Teléfono</Label>
          <Input
            id={inputId("phone")}
            name="phone"
            value={values.phone}
            onChange={handleTextChange("phone")}
            ref={(node) => (fieldRefs.current.phone = node)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone")}
          />
          {errors.phone && <span id={errorId("phone")} className="text-xs text-rose-600" role="alert">{errors.phone}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("email")}>Correo</Label>
          <Input
            id={inputId("email")}
            name="email"
            type="email"
            value={values.email}
            onChange={handleTextChange("email")}
            ref={(node) => (fieldRefs.current.email = node)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errors.email && <span id={errorId("email")} className="text-xs text-rose-600" role="alert">{errors.email}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("plan")}>Plan</Label>
          <Input id={inputId("plan")} name="plan" value={values.plan} onChange={handleTextChange("plan")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("ipAddress")}>Dirección IP</Label>
          <Input
            id={inputId("ipAddress")}
            name="ipAddress"
            value={values.ipAddress}
            onChange={handleTextChange("ipAddress")}
            ref={(node) => (fieldRefs.current.ipAddress = node)}
            aria-invalid={Boolean(errors.ipAddress)}
            aria-describedby={describedBy("ipAddress")}
          />
          {errors.ipAddress && <span id={errorId("ipAddress")} className="text-xs text-rose-600" role="alert">{errors.ipAddress}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>Estado</Label>
          <select
            id={inputId("status")}
            name="status"
            value={values.status}
            onChange={handleSelectChange("status")}
            className={fieldClass}
            ref={(node) => (fieldRefs.current.status = node)}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={describedBy("status")}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("latitude")}>Latitud</Label>
          <Input id={inputId("latitude")} name="latitude" type="number" step="any" value={values.latitude ?? ""} onChange={handleNumberChange("latitude")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("longitude")}>Longitud</Label>
          <Input id={inputId("longitude")} name="longitude" type="number" step="any" value={values.longitude ?? ""} onChange={handleNumberChange("longitude")} />
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

export default ClientForm
