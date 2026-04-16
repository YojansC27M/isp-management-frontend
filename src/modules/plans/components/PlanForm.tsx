import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { PlanFormValues, PlanType } from "../types/plan"

interface PlanFormProps {
  initialValues: PlanFormValues
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

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `plan-form-${field}`
const errorId = (field: string) => `plan-form-${field}-error`

const PlanForm = ({ initialValues, onSubmit, submitLabel }: PlanFormProps) => {
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
    if (!values.name.trim()) nextErrors.name = t("plans.form.error.nameRequired")
    const download = Number(values.downloadSpeed)
    if (!values.downloadSpeed || Number.isNaN(download) || download <= 0) {
      nextErrors.downloadSpeed = t("plans.form.error.downloadSpeed")
    }
    const upload = Number(values.uploadSpeed)
    if (!values.uploadSpeed || Number.isNaN(upload) || upload <= 0) {
      nextErrors.uploadSpeed = t("plans.form.error.uploadSpeed")
    }
    const price = Number(values.price)
    if (!values.price || Number.isNaN(price) || price <= 0) nextErrors.price = t("plans.form.error.price")
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

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
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
          />
          {errors.name && <span id={errorId("name")} className="text-xs text-rose-600" role="alert">{errors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("downloadSpeed")}>{t("plans.form.downloadSpeed")}</Label>
          <Input
            id={inputId("downloadSpeed")}
            name="downloadSpeed"
            type="number"
            min="0"
            step="1"
            value={values.downloadSpeed}
            onChange={handleChange("downloadSpeed")}
            ref={(node) => (fieldRefs.current.downloadSpeed = node)}
            aria-invalid={Boolean(errors.downloadSpeed)}
            aria-describedby={describedBy("downloadSpeed")}
          />
          {errors.downloadSpeed && <span id={errorId("downloadSpeed")} className="text-xs text-rose-600" role="alert">{errors.downloadSpeed}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("uploadSpeed")}>{t("plans.form.uploadSpeed")}</Label>
          <Input
            id={inputId("uploadSpeed")}
            name="uploadSpeed"
            type="number"
            min="0"
            step="1"
            value={values.uploadSpeed}
            onChange={handleChange("uploadSpeed")}
            ref={(node) => (fieldRefs.current.uploadSpeed = node)}
            aria-invalid={Boolean(errors.uploadSpeed)}
            aria-describedby={describedBy("uploadSpeed")}
          />
          {errors.uploadSpeed && <span id={errorId("uploadSpeed")} className="text-xs text-rose-600" role="alert">{errors.uploadSpeed}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("price")}>{t("plans.form.price")}</Label>
          <Input
            id={inputId("price")}
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={handleChange("price")}
            ref={(node) => (fieldRefs.current.price = node)}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={describedBy("price")}
          />
          {errors.price && <span id={errorId("price")} className="text-xs text-rose-600" role="alert">{errors.price}</span>}
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
          {errors.type && <span id={errorId("type")} className="text-xs text-rose-600" role="alert">{errors.type}</span>}
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel ?? t("common.save")}</Button>
      </div>
    </form>
  )
}

export default PlanForm
