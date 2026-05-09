import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Gauge, UploadCloud, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import { formatCurrency } from "@/lib/currency"
import type { PlanFormValues, PlanType } from "../types/plan"

interface PlanFormProps {
  initialValues: PlanFormValues
  currency?: string
  onSubmit: (values: PlanFormValues) => void
  submitLabel?: string
}

type PlanFormState = {
  name: string
  downloadSpeed: string
  uploadSpeed: string
  price: string
  type: PlanType | ""
}

type FormErrors = Partial<Record<keyof PlanFormState, string>>
type FocusableField = keyof PlanFormState

const selectClass = "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `plan-form-${field}`
const errorId = (field: string) => `plan-form-${field}-error`

const PlanForm = ({ initialValues, currency = "COP", onSubmit, submitLabel }: PlanFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<PlanFormState>({
    name: initialValues.name,
    downloadSpeed: initialValues.downloadSpeed ? String(initialValues.downloadSpeed) : "",
    uploadSpeed: initialValues.uploadSpeed ? String(initialValues.uploadSpeed) : "",
    price: initialValues.price ? String(initialValues.price) : "",
    type: initialValues.type,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      name: initialValues.name,
      downloadSpeed: initialValues.downloadSpeed ? String(initialValues.downloadSpeed) : "",
      uploadSpeed: initialValues.uploadSpeed ? String(initialValues.uploadSpeed) : "",
      price: initialValues.price ? String(initialValues.price) : "",
      type: initialValues.type,
    })
  }, [initialValues])

  const handleChange = (field: keyof PlanFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, type: event.target.value as PlanType }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const name = values.name.trim()
    if (!name) nextErrors.name = t("plans.form.error.nameRequired")
    if (name.length > 120) nextErrors.name = t("plans.form.error.nameLength")

    const download = Number(values.downloadSpeed)
    if (!values.downloadSpeed || Number.isNaN(download) || download <= 0) {
      nextErrors.downloadSpeed = t("plans.form.error.downloadSpeed")
    } else if (download > 100000) {
      nextErrors.downloadSpeed = t("plans.form.error.downloadSpeedMax")
    }

    const upload = Number(values.uploadSpeed)
    if (!values.uploadSpeed || Number.isNaN(upload) || upload <= 0) {
      nextErrors.uploadSpeed = t("plans.form.error.uploadSpeed")
    } else if (upload > 100000) {
      nextErrors.uploadSpeed = t("plans.form.error.uploadSpeedMax")
    }

    const price = Number(values.price)
    if (!values.price || Number.isNaN(price) || price <= 0) {
      nextErrors.price = t("plans.form.error.price")
    } else if (price > 10000000) {
      nextErrors.price = t("plans.form.error.priceMax")
    }

    if (!values.type) nextErrors.type = t("plans.form.error.typeRequired")

    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["name", "downloadSpeed", "uploadSpeed", "price", "type"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      name: values.name.trim(),
      downloadSpeed: Number(values.downloadSpeed),
      uploadSpeed: Number(values.uploadSpeed),
      price: Number(values.price),
      type: values.type as PlanType,
    })
  }

  const describedBy = (field: keyof PlanFormState) => (errors[field] ? errorId(field) : undefined)

  const preview = useMemo(() => {
    const download = Number(values.downloadSpeed) || 0
    const upload = Number(values.uploadSpeed) || 0
    const price = Number(values.price) || 0
    const typeLabel = values.type ? t(`plans.form.type.${values.type}`) : t("plans.form.selectType")

    return {
      name: values.name.trim() || t("plans.preview.defaultName"),
      download,
      upload,
      price,
      typeLabel,
    }
  }, [t, values.downloadSpeed, values.name, values.price, values.type, values.uploadSpeed])

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-border bg-card p-5" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 md:col-span-2">
            <Label htmlFor={inputId("name")}>{t("plans.form.name")}</Label>
            <Input
              id={inputId("name")}
              name="name"
              value={values.name}
              onChange={handleChange("name")}
              ref={(node) => (fieldRefs.current.name = node)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("name")}
              maxLength={120}
            />
            {errors.name && (
              <span id={errorId("name")} className="text-xs text-rose-600" role="alert">
                {errors.name}
              </span>
            )}
          </label>

          <label className="grid gap-1.5">
            <Label htmlFor={inputId("downloadSpeed")}>{t("plans.form.downloadSpeed")}</Label>
            <Input
              id={inputId("downloadSpeed")}
              name="downloadSpeed"
              type="number"
              min="0"
              max="100000"
              step="1"
              value={values.downloadSpeed}
              onChange={handleChange("downloadSpeed")}
              ref={(node) => (fieldRefs.current.downloadSpeed = node)}
              aria-invalid={Boolean(errors.downloadSpeed)}
              aria-describedby={describedBy("downloadSpeed")}
            />
            {errors.downloadSpeed && (
              <span id={errorId("downloadSpeed")} className="text-xs text-rose-600" role="alert">
                {errors.downloadSpeed}
              </span>
            )}
          </label>

          <label className="grid gap-1.5">
            <Label htmlFor={inputId("uploadSpeed")}>{t("plans.form.uploadSpeed")}</Label>
            <Input
              id={inputId("uploadSpeed")}
              name="uploadSpeed"
              type="number"
              min="0"
              max="100000"
              step="1"
              value={values.uploadSpeed}
              onChange={handleChange("uploadSpeed")}
              ref={(node) => (fieldRefs.current.uploadSpeed = node)}
              aria-invalid={Boolean(errors.uploadSpeed)}
              aria-describedby={describedBy("uploadSpeed")}
            />
            {errors.uploadSpeed && (
              <span id={errorId("uploadSpeed")} className="text-xs text-rose-600" role="alert">
                {errors.uploadSpeed}
              </span>
            )}
          </label>

          <label className="grid gap-1.5">
            <Label htmlFor={inputId("price")}>{t("plans.form.price")}</Label>
            <Input
              id={inputId("price")}
              name="price"
              type="number"
              min="0"
              max="10000000"
              step="0.01"
              value={values.price}
              onChange={handleChange("price")}
              ref={(node) => (fieldRefs.current.price = node)}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describedBy("price")}
            />
            {errors.price && (
              <span id={errorId("price")} className="text-xs text-rose-600" role="alert">
                {errors.price}
              </span>
            )}
          </label>

          <label className="grid gap-1.5">
            <Label htmlFor={inputId("type")}>{t("plans.form.type")}</Label>
            <select
              id={inputId("type")}
              name="type"
              value={values.type}
              onChange={handleSelectChange}
              className={selectClass}
              ref={(node) => (fieldRefs.current.type = node)}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={describedBy("type")}
            >
              <option value="">{t("plans.form.selectType")}</option>
              <option value="residential">{t("plans.form.type.residential")}</option>
              <option value="business">{t("plans.form.type.business")}</option>
            </select>
            {errors.type && (
              <span id={errorId("type")} className="text-xs text-rose-600" role="alert">
                {errors.type}
              </span>
            )}
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit">{submitLabel ?? t("common.save")}</Button>
        </div>
      </form>

      <aside className="rounded-xl border border-border bg-[linear-gradient(145deg,#0f172a,#1d4ed8_60%,#0f766e)] p-5 text-white shadow-[0_22px_50px_-26px_rgba(15,23,42,0.9)]">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">{t("plans.preview.title")}</p>
        <h3 className="mt-2 text-2xl font-semibold">{preview.name}</h3>
        <p className="mt-1 text-sm text-cyan-50/90">{preview.typeLabel}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-cyan-100">
              <Gauge className="h-3.5 w-3.5" />
              {t("plans.table.download")}
            </p>
            <p className="mt-2 text-xl font-semibold">{preview.download} Mbps</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-cyan-100">
              <UploadCloud className="h-3.5 w-3.5" />
              {t("plans.table.upload")}
            </p>
            <p className="mt-2 text-xl font-semibold">{preview.upload} Mbps</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-cyan-100">
              <Wallet className="h-3.5 w-3.5" />
              {t("plans.table.price")}
            </p>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(preview.price, currency)}</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default PlanForm
