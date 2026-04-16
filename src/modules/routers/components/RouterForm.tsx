import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { RouterConnectionResult, RouterFormValues } from "../types/router"

interface RouterFormProps {
  initialValues: RouterFormValues
  submitLabel: string
  canEdit: boolean
  onSubmit: (values: RouterFormValues) => Promise<void> | void
  onTestConnection: (values: RouterFormValues) => Promise<RouterConnectionResult>
}

type RouterFormState = Omit<RouterFormValues, "port" | "latitude" | "longitude"> & {
  port: string
  latitude: string
  longitude: string
}
type FormErrors = Partial<Record<keyof RouterFormState, string>>
type FocusableField = keyof RouterFormState

const inputId = (field: string) => `router-form-${field}`
const errorId = (field: string) => `router-form-${field}-error`

const RouterForm = ({ initialValues, submitLabel, canEdit, onSubmit, onTestConnection }: RouterFormProps) => {
  const [values, setValues] = useState<RouterFormState>({
    ...initialValues,
    port: String(initialValues.port || 8728),
    latitude: initialValues.latitude == null ? "" : String(initialValues.latitude),
    longitude: initialValues.longitude == null ? "" : String(initialValues.longitude),
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<RouterConnectionResult | null>(null)
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      ...initialValues,
      port: String(initialValues.port || 8728),
      latitude: initialValues.latitude == null ? "" : String(initialValues.latitude),
      longitude: initialValues.longitude == null ? "" : String(initialValues.longitude),
    })
  }, [initialValues])

  const handleChange = (field: keyof RouterFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) nextErrors.name = "El nombre del router es obligatorio."
    if (!values.ip.trim()) {
      nextErrors.ip = "La IP es obligatoria."
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(values.ip.trim())) {
      nextErrors.ip = "La IP no tiene un formato valido."
    }
    const portValue = Number(values.port)
    if (!values.port || Number.isNaN(portValue) || portValue <= 0 || portValue > 65535) {
      nextErrors.port = "El puerto debe estar entre 1 y 65535."
    }
    if (!values.username.trim()) nextErrors.username = "El usuario es obligatorio."
    if (!values.password.trim()) nextErrors.password = "La contrasena es obligatoria."
    if (!values.zone.trim()) nextErrors.zone = "La zona es obligatoria."
    setErrors(nextErrors)
    return nextErrors
  }

  const parseValues = (): RouterFormValues => ({
    name: values.name.trim(),
    ip: values.ip.trim(),
    port: Number(values.port),
    username: values.username.trim(),
    password: values.password,
    zone: values.zone.trim(),
    location: values.location.trim(),
    latitude: values.latitude === "" ? null : Number(values.latitude),
    longitude: values.longitude === "" ? null : Number(values.longitude),
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["name", "ip", "port", "username", "password", "zone"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit(parseValues())
    } finally {
      setSaving(false)
    }
  }

  const handleConnectionTest = async () => {
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) return
    setTesting(true)
    try {
      const result = await onTestConnection(parseValues())
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  const describedBy = (field: keyof RouterFormState) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("name")}>Nombre</Label>
          <Input
            id={inputId("name")}
            value={values.name}
            onChange={handleChange("name")}
            ref={(node) => (fieldRefs.current.name = node)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
            disabled={!canEdit}
          />
          {errors.name ? <span id={errorId("name")} className="text-xs text-rose-600">{errors.name}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("ip")}>IP</Label>
          <Input
            id={inputId("ip")}
            value={values.ip}
            onChange={handleChange("ip")}
            ref={(node) => (fieldRefs.current.ip = node)}
            aria-invalid={Boolean(errors.ip)}
            aria-describedby={describedBy("ip")}
            disabled={!canEdit}
          />
          {errors.ip ? <span id={errorId("ip")} className="text-xs text-rose-600">{errors.ip}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("port")}>Puerto API</Label>
          <Input
            id={inputId("port")}
            type="number"
            min={1}
            max={65535}
            value={values.port}
            onChange={handleChange("port")}
            ref={(node) => (fieldRefs.current.port = node)}
            aria-invalid={Boolean(errors.port)}
            aria-describedby={describedBy("port")}
            disabled={!canEdit}
          />
          {errors.port ? <span id={errorId("port")} className="text-xs text-rose-600">{errors.port}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("username")}>Usuario</Label>
          <Input
            id={inputId("username")}
            value={values.username}
            onChange={handleChange("username")}
            ref={(node) => (fieldRefs.current.username = node)}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={describedBy("username")}
            disabled={!canEdit}
          />
          {errors.username ? <span id={errorId("username")} className="text-xs text-rose-600">{errors.username}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("password")}>Contrasena</Label>
          <Input
            id={inputId("password")}
            type="password"
            value={values.password}
            onChange={handleChange("password")}
            ref={(node) => (fieldRefs.current.password = node)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={describedBy("password")}
            disabled={!canEdit}
          />
          {errors.password ? <span id={errorId("password")} className="text-xs text-rose-600">{errors.password}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("zone")}>Zona</Label>
          <Input
            id={inputId("zone")}
            value={values.zone}
            onChange={handleChange("zone")}
            ref={(node) => (fieldRefs.current.zone = node)}
            aria-invalid={Boolean(errors.zone)}
            aria-describedby={describedBy("zone")}
            disabled={!canEdit}
          />
          {errors.zone ? <span id={errorId("zone")} className="text-xs text-rose-600">{errors.zone}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("location")}>Ubicacion</Label>
          <Input id={inputId("location")} value={values.location} onChange={handleChange("location")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("latitude")}>Latitud</Label>
          <Input id={inputId("latitude")} type="number" step="any" value={values.latitude} onChange={handleChange("latitude")} disabled={!canEdit} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("longitude")}>Longitud</Label>
          <Input id={inputId("longitude")} type="number" step="any" value={values.longitude} onChange={handleChange("longitude")} disabled={!canEdit} />
        </label>
      </div>

      {testResult ? (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            testResult.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <p className="font-semibold">{testResult.success ? "Conexion exitosa" : "Conexion fallida"}</p>
          <p className="text-xs">{testResult.message}</p>
          {testResult.latencyMs != null ? <p className="text-xs">Latencia: {testResult.latencyMs} ms</p> : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={handleConnectionTest} disabled={!canEdit || testing}>
          {testing ? "Probando..." : "Probar conexion"}
        </Button>
        <Button type="submit" disabled={!canEdit || saving}>
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default RouterForm

