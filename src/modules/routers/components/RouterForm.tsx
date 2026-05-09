import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorDescription } from "@/lib/errors"
import type { RouterConnectionPayload, RouterConnectionResult, RouterFormValues } from "../types/router"

interface RouterFormProps {
  initialValues: RouterFormValues
  submitLabel: string
  canEdit: boolean
  onSubmit: (values: RouterFormValues) => Promise<void> | void
  onTestConnection: (values: RouterConnectionPayload) => Promise<RouterConnectionResult>
  requireSuccessfulTestBeforeSubmit?: boolean
  passwordRequired?: boolean
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
const TEST_VALID_WINDOW_MS = 5 * 60 * 1000

const isValidIpv4 = (value: string) => {
  const segments = value.split(".")
  if (segments.length !== 4) return false

  return segments.every((segment) => {
    if (!/^\d+$/.test(segment)) return false
    const parsed = Number(segment)
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 255
  })
}

const RouterForm = ({
  initialValues,
  submitLabel,
  canEdit,
  onSubmit,
  onTestConnection,
  requireSuccessfulTestBeforeSubmit = false,
  passwordRequired = true,
}: RouterFormProps) => {
  const [values, setValues] = useState<RouterFormState>({
    ...initialValues,
    port: String(initialValues.port || 80),
    latitude: initialValues.latitude == null ? "" : String(initialValues.latitude),
    longitude: initialValues.longitude == null ? "" : String(initialValues.longitude),
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<RouterConnectionResult | null>(null)
  const [submitGuardError, setSubmitGuardError] = useState("")
  const [lastSuccessfulTest, setLastSuccessfulTest] = useState<{ fingerprint: string; checkedAt: number } | null>(null)
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      ...initialValues,
      port: String(initialValues.port || 80),
      latitude: initialValues.latitude == null ? "" : String(initialValues.latitude),
      longitude: initialValues.longitude == null ? "" : String(initialValues.longitude),
    })
    setErrors({})
    setTestResult(null)
    setSubmitGuardError("")
    setLastSuccessfulTest(null)
  }, [initialValues])

  const currentConnectivityFingerprint = `${values.ip.trim()}|${values.port.trim()}|${values.username.trim()}|${values.password}`
  const hasRecentSuccessfulTest =
    lastSuccessfulTest != null
    && lastSuccessfulTest.fingerprint === currentConnectivityFingerprint
    && Date.now() - lastSuccessfulTest.checkedAt <= TEST_VALID_WINDOW_MS

  const handleChange = (field: keyof RouterFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setSubmitGuardError("")
    setTestResult(null)
    setLastSuccessfulTest(null)
  }

  const setPortPreset = (port: "80" | "8443") => {
    setValues((current) => ({ ...current, port }))
    setSubmitGuardError("")
    setTestResult(null)
    setLastSuccessfulTest(null)
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) nextErrors.name = "El nombre del router es obligatorio."
    if (!values.ip.trim()) {
      nextErrors.ip = "La IP es obligatoria."
    } else if (!isValidIpv4(values.ip.trim())) {
      nextErrors.ip = "La IP debe ser una IPv4 valida."
    }
    const portValue = Number(values.port)
    if (!values.port || Number.isNaN(portValue) || portValue <= 0 || portValue > 65535) {
      nextErrors.port = "El puerto debe estar entre 1 y 65535."
    }
    if (!values.username.trim()) nextErrors.username = "El usuario es obligatorio."
    if (passwordRequired && !values.password.trim()) nextErrors.password = "La contrasena es obligatoria."
    if (!values.zone.trim()) nextErrors.zone = "La zona es obligatoria."
    if (!values.location.trim()) nextErrors.location = "La ubicacion es obligatoria."
    if (values.latitude !== "") {
      const latitude = Number(values.latitude)
      if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
        nextErrors.latitude = "La latitud debe estar entre -90 y 90."
      }
    }
    if (values.longitude !== "") {
      const longitude = Number(values.longitude)
      if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
        nextErrors.longitude = "La longitud debe estar entre -180 y 180."
      }
    }
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
      const order: FocusableField[] = ["name", "ip", "port", "username", "password", "zone", "location"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }
    if (requireSuccessfulTestBeforeSubmit && !hasRecentSuccessfulTest) {
      setSubmitGuardError("Debes ejecutar una prueba de conexion exitosa antes de crear el router.")
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
      setSubmitGuardError("")
      const payload = parseValues()
      const result = await onTestConnection({
        ip: payload.ip,
        port: payload.port,
        username: payload.username,
        password: payload.password,
      })
      setTestResult(result)
      if (result.success) {
        setLastSuccessfulTest({ fingerprint: currentConnectivityFingerprint, checkedAt: Date.now() })
      } else {
        setLastSuccessfulTest(null)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: getErrorDescription(error, "No fue posible probar la conexion con el router."),
        latencyMs: null,
        checkedAt: new Date().toISOString(),
      })
      setLastSuccessfulTest(null)
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
          <Label htmlFor={inputId("port")}>Puerto REST API</Label>
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
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40 disabled:opacity-60"
              onClick={() => setPortPreset("80")}
              disabled={!canEdit}
            >
              HTTP (80)
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40 disabled:opacity-60"
              onClick={() => setPortPreset("8443")}
              disabled={!canEdit}
            >
              HTTPS (8443)
            </button>
          </div>
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
          <Input
            id={inputId("location")}
            value={values.location}
            onChange={handleChange("location")}
            ref={(node) => (fieldRefs.current.location = node)}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={describedBy("location")}
            disabled={!canEdit}
          />
          {errors.location ? <span id={errorId("location")} className="text-xs text-rose-600">{errors.location}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("latitude")}>Latitud</Label>
          <Input id={inputId("latitude")} type="number" step="any" value={values.latitude} onChange={handleChange("latitude")} disabled={!canEdit} />
          {errors.latitude ? <span id={errorId("latitude")} className="text-xs text-rose-600">{errors.latitude}</span> : null}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("longitude")}>Longitud</Label>
          <Input id={inputId("longitude")} type="number" step="any" value={values.longitude} onChange={handleChange("longitude")} disabled={!canEdit} />
          {errors.longitude ? <span id={errorId("longitude")} className="text-xs text-rose-600">{errors.longitude}</span> : null}
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
      {submitGuardError ? <p className="text-sm text-amber-700">{submitGuardError}</p> : null}
      {requireSuccessfulTestBeforeSubmit && !hasRecentSuccessfulTest ? (
        <p className="text-xs text-muted-foreground">
          Para crear el router debes probar conexion con los datos actuales (IP, puerto, usuario y contrasena).
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={handleConnectionTest} disabled={!canEdit || testing}>
          {testing ? "Probando..." : "Probar conexion"}
        </Button>
        <Button type="submit" disabled={!canEdit || saving || (requireSuccessfulTestBeforeSubmit && !hasRecentSuccessfulTest)}>
          {saving ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default RouterForm
