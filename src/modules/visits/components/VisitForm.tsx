import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import ClientAutocompleteField, { type ClientSummary } from "@/modules/clients/components/ClientAutocompleteField"
import TechnicianAssignmentField from "@/modules/internal-users/components/TechnicianAssignmentField"
import {
  getClientZone,
  getTechnicianAssignmentOptions,
  suggestTechnicianAssignment,
} from "@/modules/internal-users/services/technicianAssignment"
import type { TechnicianAssignmentOption } from "@/modules/internal-users/types/internalUser"
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

const typeOptions: { key: string; value: VisitType }[] = [
  { key: "visits.form.type.installation", value: "installation" },
  { key: "visits.form.type.maintenance", value: "maintenance" },
  { key: "visits.form.type.support", value: "support" },
]

const statusOptions: { key: string; value: VisitStatus }[] = [
  { key: "visits.status.scheduled", value: "scheduled" },
  { key: "visits.status.in_progress", value: "in_progress" },
  { key: "visits.status.completed", value: "completed" },
  { key: "visits.status.canceled", value: "canceled" },
]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const textareaClass =
  "min-h-28 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `visit-form-${field}`
const errorId = (field: string) => `visit-form-${field}-error`

const VisitForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: VisitFormProps) => {
  const { t } = useI18n()
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
  const [assignmentOptions, setAssignmentOptions] = useState<TechnicianAssignmentOption[]>([])
  const [loadingAssignment, setLoadingAssignment] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)
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

  useEffect(() => {
    let cancelled = false
    const loadAssignmentContext = async () => {
      setLoadingAssignment(true)
      try {
        const options = await getTechnicianAssignmentOptions({
          zone: values.zone,
          scheduledDate: values.scheduledDate,
          scheduledTime: values.scheduledTime,
        })
        if (cancelled) return
        setAssignmentOptions(options)
      } finally {
        if (!cancelled) setLoadingAssignment(false)
      }
    }

    void loadAssignmentContext()
    return () => {
      cancelled = true
    }
  }, [values.zone, values.scheduledDate, values.scheduledTime])

  const handleClientSelect = async (client: ClientSummary | null) => {
    if (!client) {
      setValues((current) => ({ ...current, clientId: "", zone: "", technicianId: "" }))
      return
    }

    const detectedZone = await getClientZone(client.id)
    setValues((current) => ({
      ...current,
      clientId: client.id,
      zone: detectedZone || current.zone,
      technicianId: "",
    }))
  }

  const handleChange = (field: keyof VisitFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSelectChange = (field: "type" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const selectedTechnicianName = useMemo(() => {
    return assignmentOptions.find((item) => item.id === values.technicianId)?.name ?? t("visits.unassigned")
  }, [assignmentOptions, t, values.technicianId])

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = t("visits.form.error.clientRequired")
    if (!values.zone.trim()) nextErrors.zone = t("visits.form.error.zoneRequired")
    if (!values.type) nextErrors.type = t("visits.form.error.typeRequired")
    if (!values.scheduledDate) nextErrors.scheduledDate = t("visits.form.error.dateRequired")
    if (!values.scheduledTime) nextErrors.scheduledTime = t("visits.form.error.timeRequired")
    if (!values.status) nextErrors.status = t("visits.form.error.statusRequired")
    setErrors(nextErrors)
    return nextErrors
  }

  const handleAutoAssign = async () => {
    setAutoAssigning(true)
    try {
      const suggestion = await suggestTechnicianAssignment({
        zone: values.zone,
        scheduledDate: values.scheduledDate,
        scheduledTime: values.scheduledTime,
      })
      setValues((current) => ({ ...current, technicianId: suggestion?.id ?? "" }))
    } finally {
      setAutoAssigning(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["clientId", "zone", "type", "scheduledDate", "scheduledTime", "status"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    onSubmit({
      clientId: values.clientId.trim(),
      technicianId: values.technicianId.trim(),
      technicianName: selectedTechnicianName,
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
          <Label htmlFor={inputId("clientId")}>{t("tickets.table.client")}</Label>
          <ClientAutocompleteField
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            onSelect={(client) => void handleClientSelect(client)}
            ref={(node) => (fieldRefs.current.clientId = node)}
            ariaInvalid={Boolean(errors.clientId)}
            ariaDescribedBy={describedBy("clientId")}
          />
          {errors.clientId && <span id={errorId("clientId")} className="text-xs text-rose-600" role="alert">{errors.clientId}</span>}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("zone")}>{t("visits.filter.zone")}</Label>
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

        <div className="grid gap-1.5 md:col-span-2">
          <TechnicianAssignmentField
            value={values.technicianId}
            options={assignmentOptions}
            zone={values.zone}
            autoAssigning={autoAssigning}
            disabled={loadingAssignment}
            onChange={(technicianId) => setValues((current) => ({ ...current, technicianId }))}
            onAutoAssign={handleAutoAssign}
          />
        </div>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("type")}>{t("visits.detail.type")}</Label>
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
            <option value="">{t("visits.form.selectType")}</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.type && <span id={errorId("type")} className="text-xs text-rose-600" role="alert">{errors.type}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("scheduledDate")}>{t("visits.form.scheduledDate")}</Label>
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
          <Label htmlFor={inputId("scheduledTime")}>{t("visits.form.scheduledTime")}</Label>
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
          <Label htmlFor={inputId("status")}>{t("visits.filter.status")}</Label>
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
            <option value="">{t("visits.form.selectStatus")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("notes")}>{t("visits.detail.notes")}</Label>
          <textarea id={inputId("notes")} name="notes" rows={4} value={values.notes} onChange={handleChange("notes")} className={textareaClass} />
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel === "Guardar" ? t("common.save") : submitLabel}</Button>
      </div>
    </form>
  )
}

export default VisitForm
