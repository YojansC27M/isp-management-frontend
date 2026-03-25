import { useEffect, useState } from "react"
import type { ChangeEvent, CSSProperties, FormEvent } from "react"
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

const typeOptions: { label: string; value: VisitType }[] = [
  { label: "Installation", value: "installation" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Support", value: "support" },
]

const statusOptions: { label: string; value: VisitStatus }[] = [
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Canceled", value: "canceled" },
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

const VisitForm = ({ initialValues, onSubmit, submitLabel = "Save" }: VisitFormProps) => {
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

  const handleChange = (field: keyof VisitFormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleSelectChange = (field: "type" | "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!values.clientId.trim()) nextErrors.clientId = "Client ID is required"
    if (!values.technicianId.trim()) nextErrors.technicianId = "Technician ID is required"
    if (!values.zone.trim()) nextErrors.zone = "Zone is required"
    if (!values.type) nextErrors.type = "Type is required"
    if (!values.scheduledDate) nextErrors.scheduledDate = "Scheduled date is required"
    if (!values.scheduledTime) nextErrors.scheduledTime = "Scheduled time is required"
    if (!values.status) nextErrors.status = "Status is required"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

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

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 560 }}>
      <label style={labelStyle}>
        Client ID
        <input name="clientId" value={values.clientId} onChange={handleChange("clientId")} style={inputStyle} />
        {errors.clientId && <span style={errorStyle}>{errors.clientId}</span>}
      </label>
      <label style={labelStyle}>
        Technician ID
        <input name="technicianId" value={values.technicianId} onChange={handleChange("technicianId")} style={inputStyle} />
        {errors.technicianId && <span style={errorStyle}>{errors.technicianId}</span>}
      </label>
      <label style={labelStyle}>
        Zone
        <input name="zone" value={values.zone} onChange={handleChange("zone")} style={inputStyle} />
        {errors.zone && <span style={errorStyle}>{errors.zone}</span>}
      </label>
      <label style={labelStyle}>
        Type
        <select name="type" value={values.type} onChange={handleSelectChange("type")} style={inputStyle}>
          <option value="">Select type</option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.type && <span style={errorStyle}>{errors.type}</span>}
      </label>
      <label style={labelStyle}>
        Scheduled Date
        <input
          name="scheduledDate"
          type="date"
          value={values.scheduledDate}
          onChange={handleChange("scheduledDate")}
          style={inputStyle}
        />
        {errors.scheduledDate && <span style={errorStyle}>{errors.scheduledDate}</span>}
      </label>
      <label style={labelStyle}>
        Scheduled Time
        <input
          name="scheduledTime"
          type="time"
          value={values.scheduledTime}
          onChange={handleChange("scheduledTime")}
          style={inputStyle}
        />
        {errors.scheduledTime && <span style={errorStyle}>{errors.scheduledTime}</span>}
      </label>
      <label style={labelStyle}>
        Status
        <select name="status" value={values.status} onChange={handleSelectChange("status")} style={inputStyle}>
          <option value="">Select status</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && <span style={errorStyle}>{errors.status}</span>}
      </label>
      <label style={labelStyle}>
        Notes
        <textarea
          name="notes"
          rows={4}
          value={values.notes}
          onChange={handleChange("notes")}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}

export default VisitForm
