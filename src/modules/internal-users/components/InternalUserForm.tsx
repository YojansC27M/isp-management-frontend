import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import { getDocumentTypes } from "@/modules/system-settings/services/systemSettingsApi"
import {
  INTERNAL_USER_DOCUMENT_TYPE_OPTIONS,
  INTERNAL_USER_ROLE_OPTIONS,
  TECHNICIAN_AVAILABILITY_PRESETS,
  type InternalUserDocumentType,
  type InternalUserFormValues,
  type InternalUserRole,
  type TechnicianAvailabilitySlot,
} from "../types/internalUser"

interface InternalUserFormProps {
  initialValues: InternalUserFormValues
  onSubmit: (values: InternalUserFormValues) => void
  submitLabel?: string
  isSubmitting?: boolean
}

type InternalUserFormState = {
  name: string
  email: string
  documentType: InternalUserDocumentType
  documentNumber: string
  phone: string
  role: InternalUserRole
  status: InternalUserFormValues["status"]
  coverageZones: string
  skills: string
  availabilityIds: string[]
}

type FormErrors = Partial<Record<keyof InternalUserFormState, string>>
type FocusableField = keyof InternalUserFormState

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `internal-user-form-${field}`
const errorId = (field: string) => `internal-user-form-${field}-error`

const splitCsv = (value: string) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[0-9+\-\s()]{7,20}$/
const documentNumberRegex = /^[A-Za-z0-9.\-]{4,32}$/

const mapAvailabilityIds = (availability: TechnicianAvailabilitySlot[]) => {
  const knownIds = new Set(TECHNICIAN_AVAILABILITY_PRESETS.map((item) => item.id))
  return availability.filter((slot) => knownIds.has(slot.id)).map((slot) => slot.id)
}

const toAvailabilitySlots = (ids: string[]) => {
  const map = new Map(TECHNICIAN_AVAILABILITY_PRESETS.map((item) => [item.id, item]))
  return ids.map((id) => map.get(id)).filter((item): item is TechnicianAvailabilitySlot => Boolean(item))
}

const InternalUserForm = ({ initialValues, onSubmit, submitLabel = "Guardar", isSubmitting = false }: InternalUserFormProps) => {
  const { t } = useI18n()
  const [documentTypeOptions, setDocumentTypeOptions] = useState(INTERNAL_USER_DOCUMENT_TYPE_OPTIONS)
  const [values, setValues] = useState<InternalUserFormState>({
    name: initialValues.name,
    email: initialValues.email,
    documentType: initialValues.documentType,
    documentNumber: initialValues.documentNumber,
    phone: initialValues.phone,
    role: initialValues.role,
    status: initialValues.status,
    coverageZones: initialValues.technicianProfile?.coverageZones.join(", ") ?? "",
    skills: initialValues.technicianProfile?.skills.join(", ") ?? "",
    availabilityIds: initialValues.technicianProfile ? mapAvailabilityIds(initialValues.technicianProfile.availability) : [],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const catalog = await getDocumentTypes()
        if (catalog.length === 0) return
        setDocumentTypeOptions(catalog.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` })))
      } catch {
        setDocumentTypeOptions(INTERNAL_USER_DOCUMENT_TYPE_OPTIONS)
      }
    }

    loadDocumentTypes()
  }, [])

  useEffect(() => {
    setValues({
      name: initialValues.name,
      email: initialValues.email,
      documentType: initialValues.documentType,
      documentNumber: initialValues.documentNumber,
      phone: initialValues.phone,
      role: initialValues.role,
      status: initialValues.status,
      coverageZones: initialValues.technicianProfile?.coverageZones.join(", ") ?? "",
      skills: initialValues.technicianProfile?.skills.join(", ") ?? "",
      availabilityIds: initialValues.technicianProfile ? mapAvailabilityIds(initialValues.technicianProfile.availability) : [],
    })
  }, [initialValues])

  const handleChange = (field: "name" | "email" | "documentNumber" | "phone" | "coverageZones" | "skills") => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  const handleSelect = (field: "role" | "status" | "documentType") => {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value
      setValues((current) => {
        if (field === "documentType") {
          return { ...current, documentType: value as InternalUserDocumentType }
        }
        if (field === "role") {
          const role = value as InternalUserRole
          if (role !== "technician") {
            return { ...current, role, coverageZones: "", skills: "", availabilityIds: [] }
          }
          return { ...current, role }
        }
        return { ...current, status: value as InternalUserFormValues["status"] }
      })
    }
  }

  const handleAvailabilityToggle = (availabilityId: string) => {
    setValues((current) => {
      const set = new Set(current.availabilityIds)
      if (set.has(availabilityId)) {
        set.delete(availabilityId)
      } else {
        set.add(availabilityId)
      }
      return { ...current, availabilityIds: Array.from(set) }
    })
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) nextErrors.name = t("internalUsers.form.error.nameRequired")
    const email = values.email.trim()
    const documentNumber = values.documentNumber.trim()
    const phone = values.phone.trim()
    if (!email) {
      nextErrors.email = t("internalUsers.form.error.emailRequired")
    } else if (!emailRegex.test(email)) {
      nextErrors.email = t("internalUsers.form.error.emailInvalid")
    }
    if (!phone) {
      nextErrors.phone = t("internalUsers.form.error.phoneRequired")
    } else if (!phoneRegex.test(phone)) {
      nextErrors.phone = t("internalUsers.form.error.phoneInvalid")
    }
    if (!documentNumber) {
      nextErrors.documentNumber = t("internalUsers.form.error.documentNumberRequired")
    } else if (!documentNumberRegex.test(documentNumber)) {
      nextErrors.documentNumber = t("internalUsers.form.error.documentNumberInvalid")
    }
    if (values.role === "technician") {
      if (splitCsv(values.coverageZones).length === 0) nextErrors.coverageZones = t("internalUsers.form.error.coverageRequired")
      if (splitCsv(values.skills).length === 0) nextErrors.skills = t("internalUsers.form.error.skillsRequired")
      if (values.availabilityIds.length === 0) nextErrors.availabilityIds = t("internalUsers.form.error.availabilityRequired")
    }
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = [
        "name",
        "email",
        "documentType",
        "documentNumber",
        "phone",
        "role",
        "status",
        "coverageZones",
        "skills",
        "availabilityIds",
      ]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      name: values.name.trim(),
      email,
      documentType: values.documentType,
      documentNumber,
      phone,
      role: values.role,
      status: values.status,
      technicianProfile:
        values.role === "technician"
          ? {
              coverageZones: splitCsv(values.coverageZones),
              skills: splitCsv(values.skills),
              availability: toAvailabilitySlots(values.availabilityIds),
            }
          : null,
    })
  }

  const describedBy = (field: keyof InternalUserFormState) => (errors[field] ? errorId(field) : undefined)

  const email = values.email.trim()
  const documentNumber = values.documentNumber.trim()
  const phone = values.phone.trim()

  return (
    <form onSubmit={handleSubmit} className="grid max-w-4xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("name")}>{t("profile.name")}</Label>
          <Input
            id={inputId("name")}
            value={values.name}
            onChange={handleChange("name")}
            ref={(node) => (fieldRefs.current.name = node)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            disabled={isSubmitting}
          />
          {errors.name && <span id={errorId("name")} className="text-xs text-rose-600" role="alert">{errors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("email")}>{t("profile.email")}</Label>
          <Input
            id={inputId("email")}
            type="email"
            value={values.email}
            onChange={handleChange("email")}
            ref={(node) => (fieldRefs.current.email = node)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
            disabled={isSubmitting}
          />
          {errors.email && <span id={errorId("email")} className="text-xs text-rose-600" role="alert">{errors.email}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("phone")}>{t("internalUsers.table.phone")}</Label>
          <Input
            id={inputId("phone")}
            value={values.phone}
            onChange={handleChange("phone")}
            ref={(node) => (fieldRefs.current.phone = node)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone")}
            disabled={isSubmitting}
          />
          {errors.phone && <span id={errorId("phone")} className="text-xs text-rose-600" role="alert">{errors.phone}</span>}
        </label>
        <div className="grid gap-1.5">
          <Label>{t("internalUsers.table.document")}</Label>
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <select
              id={inputId("documentType")}
              className={selectClass}
              value={values.documentType}
              onChange={handleSelect("documentType")}
              ref={(node) => (fieldRefs.current.documentType = node)}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.documentType)}
              aria-describedby={describedBy("documentType")}
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              id={inputId("documentNumber")}
              value={values.documentNumber}
              onChange={handleChange("documentNumber")}
              placeholder={t("internalUsers.form.documentNumberPlaceholder")}
              ref={(node) => (fieldRefs.current.documentNumber = node)}
              aria-invalid={Boolean(errors.documentNumber)}
              aria-describedby={describedBy("documentNumber")}
              disabled={isSubmitting}
            />
          </div>
          <span className="text-xs text-muted-foreground">{t("internalUsers.form.documentHint")}</span>
          {errors.documentNumber && (
            <span id={errorId("documentNumber")} className="text-xs text-rose-600" role="alert">
              {errors.documentNumber}
            </span>
          )}
        </div>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("role")}>{t("internalUsers.table.role")}</Label>
          <select
            id={inputId("role")}
            className={selectClass}
            value={values.role}
            onChange={handleSelect("role")}
            ref={(node) => (fieldRefs.current.role = node)}
            disabled={isSubmitting}
          >
            {INTERNAL_USER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`internalUsers.role.${option.value}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("internalUsers.table.status")}</Label>
          <select
            id={inputId("status")}
            className={selectClass}
            value={values.status}
            onChange={handleSelect("status")}
            ref={(node) => (fieldRefs.current.status = node)}
            disabled={isSubmitting}
          >
            <option value="active">{t("internalUsers.status.active")}</option>
            <option value="inactive">{t("internalUsers.status.inactive")}</option>
          </select>
        </label>
      </div>

      {values.role === "technician" && (
        <section className="grid gap-4 rounded-lg border border-border/80 bg-muted/20 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("internalUsers.form.techProfileTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("internalUsers.form.techProfileDesc")}</p>
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("coverageZones")}>{t("internalUsers.form.coverageZones")}</Label>
            <Input
              id={inputId("coverageZones")}
              value={values.coverageZones}
              onChange={handleChange("coverageZones")}
              placeholder={t("internalUsers.form.coveragePlaceholder")}
              ref={(node) => (fieldRefs.current.coverageZones = node)}
              aria-invalid={Boolean(errors.coverageZones)}
              aria-describedby={describedBy("coverageZones")}
              disabled={isSubmitting}
            />
            <span className="text-xs text-muted-foreground">{t("internalUsers.form.csvHint")}</span>
            {errors.coverageZones && (
              <span id={errorId("coverageZones")} className="text-xs text-rose-600" role="alert">
                {errors.coverageZones}
              </span>
            )}
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("skills")}>{t("internalUsers.table.skills")}</Label>
            <Input
              id={inputId("skills")}
              value={values.skills}
              onChange={handleChange("skills")}
              placeholder={t("internalUsers.form.skillsPlaceholder")}
              ref={(node) => (fieldRefs.current.skills = node)}
              aria-invalid={Boolean(errors.skills)}
              aria-describedby={describedBy("skills")}
              disabled={isSubmitting}
            />
            <span className="text-xs text-muted-foreground">{t("internalUsers.form.csvHint")}</span>
            {errors.skills && <span id={errorId("skills")} className="text-xs text-rose-600" role="alert">{errors.skills}</span>}
          </label>
          <div className="grid gap-2">
            <Label htmlFor={inputId("availability")}>{t("technicianAssignment.availability")}</Label>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3" ref={(node) => (fieldRefs.current.availabilityIds = node)}>
              {TECHNICIAN_AVAILABILITY_PRESETS.map((slot) => {
                const checked = values.availabilityIds.includes(slot.id)
                return (
                  <label
                    key={slot.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                      checked
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleAvailabilityToggle(slot.id)}
                      className="h-4 w-4 rounded border-border"
                      disabled={isSubmitting}
                    />
                    {slot.label}
                  </label>
                )
              })}
            </div>
            {errors.availabilityIds && (
              <span id={errorId("availabilityIds")} className="text-xs text-rose-600" role="alert">
                {errors.availabilityIds}
              </span>
            )}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting || !email || !phone || !documentNumber}>
          {isSubmitting ? t("common.saving") : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default InternalUserForm
