import { useEffect, useState } from "react"
import type { ChangeEvent, CSSProperties, FormEvent } from "react"
import type { ClientFormValues, ClientStatus } from "../types/client"

interface ClientFormProps {
  initialValues: ClientFormValues
  onSubmit: (values: ClientFormValues) => void
  submitLabel?: string
}

type FormErrors = Partial<Record<keyof ClientFormValues, string>>

const statusOptions: { label: string; value: ClientStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Inactive", value: "inactive" },
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

const ClientForm = ({ initialValues, onSubmit, submitLabel = "Save" }: ClientFormProps) => {
  const [values, setValues] = useState<ClientFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function setFieldValue<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
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

    if (!values.name.trim()) nextErrors.name = "Name is required"
    if (!values.document.trim()) nextErrors.document = "Document is required"
    if (!values.phone.trim()) nextErrors.phone = "Phone is required"
    if (!values.email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Email is invalid"
    }
    if (!values.ipAddress.trim()) nextErrors.ipAddress = "IP Address is required"
    if (!values.status) nextErrors.status = "Status is required"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 520 }}>
      <label style={labelStyle}>
        Name
        <input name="name" value={values.name} onChange={handleTextChange("name")} style={inputStyle} />
        {errors.name && <span style={errorStyle}>{errors.name}</span>}
      </label>
      <label style={labelStyle}>
        Document
        <input
          name="document"
          value={values.document}
          onChange={handleTextChange("document")}
          style={inputStyle}
        />
        {errors.document && <span style={errorStyle}>{errors.document}</span>}
      </label>
      <label style={labelStyle}>
        Address
        <input name="address" value={values.address} onChange={handleTextChange("address")} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Phone
        <input name="phone" value={values.phone} onChange={handleTextChange("phone")} style={inputStyle} />
        {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
      </label>
      <label style={labelStyle}>
        Email
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleTextChange("email")}
          style={inputStyle}
        />
        {errors.email && <span style={errorStyle}>{errors.email}</span>}
      </label>
      <label style={labelStyle}>
        Plan
        <input name="plan" value={values.plan} onChange={handleTextChange("plan")} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        IP Address
        <input
          name="ipAddress"
          value={values.ipAddress}
          onChange={handleTextChange("ipAddress")}
          style={inputStyle}
        />
        {errors.ipAddress && <span style={errorStyle}>{errors.ipAddress}</span>}
      </label>
      <label style={labelStyle}>
        Status
        <select name="status" value={values.status} onChange={handleSelectChange("status")} style={inputStyle}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.status && <span style={errorStyle}>{errors.status}</span>}
      </label>
      <label style={labelStyle}>
        Latitude
        <input
          name="latitude"
          type="number"
          step="any"
          value={values.latitude ?? ""}
          onChange={handleNumberChange("latitude")}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        Longitude
        <input
          name="longitude"
          type="number"
          step="any"
          value={values.longitude ?? ""}
          onChange={handleNumberChange("longitude")}
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}

export default ClientForm
