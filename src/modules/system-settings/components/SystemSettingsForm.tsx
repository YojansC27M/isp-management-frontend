import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SystemSettingsFormValues } from "../types/systemSettings"

interface SystemSettingsFormProps {
  initialValues: SystemSettingsFormValues
  onSubmit: (values: SystemSettingsFormValues) => Promise<void> | void
  onLogoUpload: (fileName: string) => Promise<void> | void
  canEdit: boolean
}

type FormErrors = Partial<Record<keyof SystemSettingsFormValues, string>>
type FocusableField = keyof SystemSettingsFormValues

const fieldClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `system-settings-${field}`
const errorId = (field: string) => `system-settings-${field}-error`

const defaultTimezones = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/New_York",
  "Europe/Madrid",
]

const currencyOptions = ["COP", "USD", "EUR"]

const SystemSettingsForm = ({ initialValues, onSubmit, onLogoUpload, canEdit }: SystemSettingsFormProps) => {
  const [values, setValues] = useState<SystemSettingsFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  const handleChange = (field: keyof SystemSettingsFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.companyName.trim()) nextErrors.companyName = "El nombre de empresa es obligatorio."
    if (!values.billingEmail.trim()) {
      nextErrors.billingEmail = "El correo de facturacion es obligatorio."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.billingEmail)) {
      nextErrors.billingEmail = "El correo de facturacion no es valido."
    }
    if (!values.currency.trim()) nextErrors.currency = "Selecciona una moneda."
    if (!values.timezone.trim()) nextErrors.timezone = "Selecciona una zona horaria."
    if (!values.invoicePrefix.trim()) nextErrors.invoicePrefix = "El prefijo de factura es obligatorio."
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      const order: FocusableField[] = ["companyName", "billingEmail", "currency", "timezone", "invoicePrefix"]
      const first = order.find((field) => validation[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit(values)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onLogoUpload(file.name)
    if (fileRef.current) fileRef.current.value = ""
  }

  const describedBy = (field: keyof SystemSettingsFormValues) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-border bg-card p-5" noValidate>
      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("companyName")}>Razon social</Label>
          <Input
            id={inputId("companyName")}
            value={values.companyName}
            onChange={handleChange("companyName")}
            ref={(node) => (fieldRefs.current.companyName = node)}
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={describedBy("companyName")}
            disabled={!canEdit}
          />
          {errors.companyName ? <span id={errorId("companyName")} className="text-xs text-rose-600">{errors.companyName}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("tradeName")}>Nombre comercial</Label>
          <Input id={inputId("tradeName")} value={values.tradeName} onChange={handleChange("tradeName")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("taxId")}>NIT / Tax ID</Label>
          <Input id={inputId("taxId")} value={values.taxId} onChange={handleChange("taxId")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("billingEmail")}>Correo de facturacion</Label>
          <Input
            id={inputId("billingEmail")}
            type="email"
            value={values.billingEmail}
            onChange={handleChange("billingEmail")}
            ref={(node) => (fieldRefs.current.billingEmail = node)}
            aria-invalid={Boolean(errors.billingEmail)}
            aria-describedby={describedBy("billingEmail")}
            disabled={!canEdit}
          />
          {errors.billingEmail ? <span id={errorId("billingEmail")} className="text-xs text-rose-600">{errors.billingEmail}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("billingPhone")}>Telefono de facturacion</Label>
          <Input id={inputId("billingPhone")} value={values.billingPhone} onChange={handleChange("billingPhone")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("address")}>Direccion fiscal</Label>
          <Input id={inputId("address")} value={values.address} onChange={handleChange("address")} disabled={!canEdit} />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("currency")}>Moneda</Label>
          <select
            id={inputId("currency")}
            className={fieldClass}
            value={values.currency}
            onChange={(event) => setValues((current) => ({ ...current, currency: event.target.value }))}
            ref={(node) => (fieldRefs.current.currency = node)}
            aria-invalid={Boolean(errors.currency)}
            aria-describedby={describedBy("currency")}
            disabled={!canEdit}
          >
            <option value="">Selecciona...</option>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          {errors.currency ? <span id={errorId("currency")} className="text-xs text-rose-600">{errors.currency}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("timezone")}>Zona horaria</Label>
          <select
            id={inputId("timezone")}
            className={fieldClass}
            value={values.timezone}
            onChange={(event) => setValues((current) => ({ ...current, timezone: event.target.value }))}
            ref={(node) => (fieldRefs.current.timezone = node)}
            aria-invalid={Boolean(errors.timezone)}
            aria-describedby={describedBy("timezone")}
            disabled={!canEdit}
          >
            <option value="">Selecciona...</option>
            {defaultTimezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
          {errors.timezone ? <span id={errorId("timezone")} className="text-xs text-rose-600">{errors.timezone}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("invoicePrefix")}>Prefijo factura</Label>
          <Input
            id={inputId("invoicePrefix")}
            value={values.invoicePrefix}
            onChange={handleChange("invoicePrefix")}
            ref={(node) => (fieldRefs.current.invoicePrefix = node)}
            aria-invalid={Boolean(errors.invoicePrefix)}
            aria-describedby={describedBy("invoicePrefix")}
            disabled={!canEdit}
          />
          {errors.invoicePrefix ? <span id={errorId("invoicePrefix")} className="text-xs text-rose-600">{errors.invoicePrefix}</span> : null}
        </label>
      </section>

      <section className="grid gap-3 rounded-lg border border-border/70 bg-muted/25 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
        <img src={values.logoUrl} alt="Logo ISP" className="h-16 w-28 rounded-md border border-border object-cover" />
        <div>
          <p className="text-sm font-medium text-foreground">Logo institucional</p>
          <p className="text-xs text-muted-foreground">Sube una imagen para el encabezado de facturas y portal de clientes.</p>
        </div>
        <Input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          onChange={handleLogoChange}
          disabled={!canEdit}
          className="max-w-[220px]"
        />
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!canEdit || saving}>
          {saving ? "Guardando..." : "Guardar ajustes"}
        </Button>
      </div>
    </form>
  )
}

export default SystemSettingsForm

