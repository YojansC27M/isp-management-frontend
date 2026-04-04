import { useEffect, useState } from "react"
import type { ChangeEvent, CSSProperties, FormEvent } from "react"
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

const typeOptions: { label: string; value: PlanType }[] = [
  { label: "Residencial", value: "residential" },
  { label: "Empresarial", value: "business" },
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

const PlanForm = ({ initialValues, onSubmit, submitLabel = "Guardar" }: PlanFormProps) => {
  const [values, setValues] = useState<PlanFormState>({
    name: initialValues.name,
    downloadSpeed: initialValues.downloadSpeed ? String(initialValues.downloadSpeed) : "",
    uploadSpeed: initialValues.uploadSpeed ? String(initialValues.uploadSpeed) : "",
    price: initialValues.price ? String(initialValues.price) : "",
    type: initialValues.type,
  })
  const [errors, setErrors] = useState<FormErrors>({})

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
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setValues((current) => ({
      ...current,
      type: event.target.value as PlanType,
    }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio"

    const download = Number(values.downloadSpeed)
    if (!values.downloadSpeed || Number.isNaN(download) || download <= 0) {
      nextErrors.downloadSpeed = "La velocidad de descarga debe ser mayor a 0"
    }

    const upload = Number(values.uploadSpeed)
    if (!values.uploadSpeed || Number.isNaN(upload) || upload <= 0) {
      nextErrors.uploadSpeed = "La velocidad de subida debe ser mayor a 0"
    }

    const price = Number(values.price)
    if (!values.price || Number.isNaN(price) || price <= 0) {
      nextErrors.price = "El precio debe ser mayor a 0"
    }

    if (!values.type) nextErrors.type = "El tipo es obligatorio"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      name: values.name.trim(),
      downloadSpeed: Number(values.downloadSpeed),
      uploadSpeed: Number(values.uploadSpeed),
      price: Number(values.price),
      type: values.type as PlanType,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 520 }}>
      <label style={labelStyle}>
        Nombre
        <input name="name" value={values.name} onChange={handleChange("name")} style={inputStyle} />
        {errors.name && <span style={errorStyle}>{errors.name}</span>}
      </label>
      <label style={labelStyle}>
        Velocidad de descarga (Mbps)
        <input
          name="downloadSpeed"
          type="number"
          min="0"
          step="1"
          value={values.downloadSpeed}
          onChange={handleChange("downloadSpeed")}
          style={inputStyle}
        />
        {errors.downloadSpeed && <span style={errorStyle}>{errors.downloadSpeed}</span>}
      </label>
      <label style={labelStyle}>
        Velocidad de subida (Mbps)
        <input
          name="uploadSpeed"
          type="number"
          min="0"
          step="1"
          value={values.uploadSpeed}
          onChange={handleChange("uploadSpeed")}
          style={inputStyle}
        />
        {errors.uploadSpeed && <span style={errorStyle}>{errors.uploadSpeed}</span>}
      </label>
      <label style={labelStyle}>
        Precio
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          value={values.price}
          onChange={handleChange("price")}
          style={inputStyle}
        />
        {errors.price && <span style={errorStyle}>{errors.price}</span>}
      </label>
      <label style={labelStyle}>
        Tipo
        <select name="type" value={values.type} onChange={handleSelectChange} style={inputStyle}>
          <option value="">Selecciona un tipo</option>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.type && <span style={errorStyle}>{errors.type}</span>}
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  )
}

export default PlanForm
