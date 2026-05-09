import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { SystemSettingsFormValues } from "../types/systemSettings"

interface SystemSettingsFormProps {
  initialValues: SystemSettingsFormValues
  onSubmit: (values: SystemSettingsFormValues) => Promise<void> | void
  onLogoUpload: (payload: { fileName: string; dataUrl: string }) => Promise<void> | void
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
const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024
const MAX_LOGO_WIDTH = 800
const MAX_LOGO_HEIGHT = 400

const optimizeImageToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const rawDataUrl = String(reader.result ?? "")
      const image = new Image()

      image.onload = () => {
        const scale = Math.min(MAX_LOGO_WIDTH / image.width, MAX_LOGO_HEIGHT / image.height, 1)
        const width = Math.max(1, Math.floor(image.width * scale))
        const height = Math.max(1, Math.floor(image.height * scale))

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Could not initialize canvas context"))
          return
        }

        context.drawImage(image, 0, 0, width, height)

        const exportMimeType = file.type === "image/png" ? "image/png" : "image/jpeg"
        const quality = exportMimeType === "image/jpeg" ? 0.85 : undefined
        const optimizedDataUrl = canvas.toDataURL(exportMimeType, quality)
        resolve(optimizedDataUrl || rawDataUrl)
      }

      image.onerror = () => reject(new Error("Could not decode selected image"))
      image.src = rawDataUrl
    }
    reader.onerror = () => reject(new Error("Could not read selected image"))
    reader.readAsDataURL(file)
  })

const SystemSettingsForm = ({ initialValues, onSubmit, onLogoUpload, canEdit }: SystemSettingsFormProps) => {
  const { t } = useI18n()
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
    if (!values.companyName.trim()) nextErrors.companyName = t("systemSettings.validation.companyName")
    if (!values.billingEmail.trim()) {
      nextErrors.billingEmail = t("systemSettings.validation.billingEmailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.billingEmail)) {
      nextErrors.billingEmail = t("systemSettings.validation.billingEmailInvalid")
    }
    if (!values.currency.trim()) nextErrors.currency = t("systemSettings.validation.currency")
    if (!values.timezone.trim()) nextErrors.timezone = t("systemSettings.validation.timezone")
    if (!values.invoicePrefix.trim()) nextErrors.invoicePrefix = t("systemSettings.validation.invoicePrefix")
    if (!/^#([0-9A-Fa-f]{6})$/.test(values.brandPrimaryColor.trim())) {
      nextErrors.brandPrimaryColor = t("systemSettings.validation.brandPrimaryColor")
    }
    if (!/^#([0-9A-Fa-f]{6})$/.test(values.brandSecondaryColor.trim())) {
      nextErrors.brandSecondaryColor = t("systemSettings.validation.brandSecondaryColor")
    }
    if (!values.legalFooter.trim()) nextErrors.legalFooter = t("systemSettings.validation.legalFooter")
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      const order: FocusableField[] = [
        "companyName",
        "billingEmail",
        "currency",
        "timezone",
        "invoicePrefix",
        "brandPrimaryColor",
        "brandSecondaryColor",
        "legalFooter",
      ]
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
    const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"])
    if (!allowedMimeTypes.has(file.type)) {
      setErrors((current) => ({ ...current, logoUrl: t("systemSettings.validation.logoFormat") }))
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    if (file.size > MAX_LOGO_UPLOAD_BYTES) {
      setErrors((current) => ({ ...current, logoUrl: t("systemSettings.validation.logoSize") }))
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    try {
      const dataUrl = await optimizeImageToDataUrl(file)
      setErrors((current) => ({ ...current, logoUrl: undefined }))
      await onLogoUpload({ fileName: file.name, dataUrl })
    } catch {
      setErrors((current) => ({ ...current, logoUrl: t("systemSettings.validation.logoProcess") }))
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const describedBy = (field: keyof SystemSettingsFormValues) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-border bg-card p-5" noValidate>
      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("companyName")}>{t("systemSettings.companyName")}</Label>
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
          <Label htmlFor={inputId("tradeName")}>{t("systemSettings.tradeName")}</Label>
          <Input id={inputId("tradeName")} value={values.tradeName} onChange={handleChange("tradeName")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("taxId")}>{t("systemSettings.taxId")}</Label>
          <Input id={inputId("taxId")} value={values.taxId} onChange={handleChange("taxId")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("billingEmail")}>{t("systemSettings.billingEmail")}</Label>
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
          <Label htmlFor={inputId("billingPhone")}>{t("systemSettings.billingPhone")}</Label>
          <Input id={inputId("billingPhone")} value={values.billingPhone} onChange={handleChange("billingPhone")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("address")}>{t("systemSettings.address")}</Label>
          <Input id={inputId("address")} value={values.address} onChange={handleChange("address")} disabled={!canEdit} />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("currency")}>{t("systemSettings.currency")}</Label>
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
            <option value="">{t("systemSettings.select")}</option>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          {errors.currency ? <span id={errorId("currency")} className="text-xs text-rose-600">{errors.currency}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("timezone")}>{t("systemSettings.timezone")}</Label>
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
            <option value="">{t("systemSettings.select")}</option>
            {defaultTimezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
          {errors.timezone ? <span id={errorId("timezone")} className="text-xs text-rose-600">{errors.timezone}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("invoicePrefix")}>{t("systemSettings.invoicePrefix")}</Label>
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

      <section className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("brandPrimaryColor")}>{t("systemSettings.brandPrimaryColor")}</Label>
          <Input
            id={inputId("brandPrimaryColor")}
            value={values.brandPrimaryColor}
            onChange={handleChange("brandPrimaryColor")}
            ref={(node) => (fieldRefs.current.brandPrimaryColor = node)}
            aria-invalid={Boolean(errors.brandPrimaryColor)}
            aria-describedby={describedBy("brandPrimaryColor")}
            disabled={!canEdit}
          />
          {errors.brandPrimaryColor ? (
            <span id={errorId("brandPrimaryColor")} className="text-xs text-rose-600">{errors.brandPrimaryColor}</span>
          ) : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("brandSecondaryColor")}>{t("systemSettings.brandSecondaryColor")}</Label>
          <Input
            id={inputId("brandSecondaryColor")}
            value={values.brandSecondaryColor}
            onChange={handleChange("brandSecondaryColor")}
            ref={(node) => (fieldRefs.current.brandSecondaryColor = node)}
            aria-invalid={Boolean(errors.brandSecondaryColor)}
            aria-describedby={describedBy("brandSecondaryColor")}
            disabled={!canEdit}
          />
          {errors.brandSecondaryColor ? (
            <span id={errorId("brandSecondaryColor")} className="text-xs text-rose-600">{errors.brandSecondaryColor}</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("legalFooter")}>{t("systemSettings.legalFooter")}</Label>
          <Input
            id={inputId("legalFooter")}
            value={values.legalFooter}
            onChange={handleChange("legalFooter")}
            ref={(node) => (fieldRefs.current.legalFooter = node)}
            aria-invalid={Boolean(errors.legalFooter)}
            aria-describedby={describedBy("legalFooter")}
            disabled={!canEdit}
          />
          {errors.legalFooter ? <span id={errorId("legalFooter")} className="text-xs text-rose-600">{errors.legalFooter}</span> : null}
        </label>
      </section>

      <section className="grid gap-3 rounded-lg border border-border/70 bg-muted/25 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
        <img src={values.logoUrl} alt="Logo ISP" className="h-16 w-28 rounded-md border border-border object-cover" />
        <div>
          <p className="text-sm font-medium text-foreground">{t("systemSettings.logo")}</p>
          <p className="text-xs text-muted-foreground">{t("systemSettings.logoDesc")}</p>
        </div>
        <Input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleLogoChange}
          disabled={!canEdit}
          className="max-w-[220px]"
        />
        {errors.logoUrl ? <span className="text-xs text-rose-600 md:col-span-3">{errors.logoUrl}</span> : null}
      </section>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={!canEdit || saving}>
          {saving ? t("systemSettings.saving") : t("systemSettings.save")}
        </Button>
      </div>
    </form>
  )
}

export default SystemSettingsForm
