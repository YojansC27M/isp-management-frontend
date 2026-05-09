import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { ClientFormValues, ClientStatus } from "../types/client"

interface ClientPlanOption {
  id: string
  name: string
}

interface ClientFormProps {
  initialValues: ClientFormValues
  onSubmit: (values: ClientFormValues) => void
  planOptions: ClientPlanOption[]
  submitLabel?: string
}

type FormErrors = Partial<Record<keyof ClientFormValues, string>>
type FocusableField = keyof ClientFormValues

const statusOptions: { key: string; value: ClientStatus }[] = [
  { key: "clients.status.active", value: "active" },
  { key: "clients.status.suspended", value: "suspended" },
  { key: "clients.status.inactive", value: "inactive" },
]

const fieldClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const errorId = (field: string) => `client-form-${field}-error`
const inputId = (field: string) => `client-form-${field}`

const ClientForm = ({ initialValues, onSubmit, planOptions, submitLabel }: ClientFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<ClientFormValues>(initialValues)
  const [planQuery, setPlanQuery] = useState("")
  const [planOpen, setPlanOpen] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})
  const planContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    const selected = planOptions.find((plan) => plan.id === values.planId)
    setPlanQuery(selected?.name ?? "")
  }, [planOptions, values.planId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!planContainerRef.current) return
      if (event.target instanceof Node && !planContainerRef.current.contains(event.target)) {
        setPlanOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function setFieldValue<K extends keyof ClientFormValues>(field: K, value: ClientFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleTextChange = (field: keyof ClientFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setFieldValue(field, event.target.value as ClientFormValues[typeof field])
  }

  const handleSelectChange = (field: "status") => (event: ChangeEvent<HTMLSelectElement>) => {
    setFieldValue(field, event.target.value as ClientStatus)
  }

  const resolvePlanIdByName = (name: string) => {
    const normalized = name.trim().toLowerCase()
    if (!normalized) return ""
    const selected = planOptions.find((plan) => plan.name.trim().toLowerCase() === normalized)
    return selected?.id ?? ""
  }

  const handlePlanChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value
    setPlanQuery(nextQuery)
    setPlanOpen(true)
    setFieldValue("planId", resolvePlanIdByName(nextQuery))
  }

  const filteredPlanOptions = useMemo(() => {
    const normalized = planQuery.trim().toLowerCase()
    if (!normalized) return planOptions
    return planOptions.filter((plan) => plan.name.toLowerCase().includes(normalized))
  }, [planOptions, planQuery])

  const handleSelectPlan = (plan: ClientPlanOption) => {
    setFieldValue("planId", plan.id)
    setPlanQuery(plan.name)
    setPlanOpen(false)
  }

  const handleNumberChange = (field: "latitude" | "longitude") => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setFieldValue(field, value === "" ? null : Number(value))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.name.trim()) nextErrors.name = t("clients.form.error.nameRequired")
    if (!values.document.trim()) nextErrors.document = t("clients.form.error.documentRequired")
    if (!values.phone.trim()) nextErrors.phone = t("clients.form.error.phoneRequired")
    if (!values.email.trim()) {
      nextErrors.email = t("clients.form.error.emailRequired")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = t("clients.form.error.emailInvalid")
    }
    if (!values.ipAddress.trim()) nextErrors.ipAddress = t("clients.form.error.ipRequired")
    if (!values.planId.trim()) nextErrors.planId = "Debes seleccionar un plan"
    if (!values.status) nextErrors.status = t("clients.form.error.statusRequired")
    setErrors(nextErrors)
    return nextErrors
  }

  const focusFirstError = (nextErrors: FormErrors) => {
    const order: FocusableField[] = ["name", "document", "phone", "email", "planId", "ipAddress", "status"]
    const first = order.find((field) => nextErrors[field])
    if (!first) return
    fieldRefs.current[first]?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors)
      return
    }
    onSubmit(values)
  }

  const describedBy = (field: keyof ClientFormValues) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("name")}>{t("clients.table.name")}</Label>
          <Input
            id={inputId("name")}
            name="name"
            value={values.name}
            onChange={handleTextChange("name")}
            ref={(node) => (fieldRefs.current.name = node)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
          />
          {errors.name && <span id={errorId("name")} className="text-xs text-rose-600" role="alert">{errors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("document")}>{t("clients.table.document")}</Label>
          <Input
            id={inputId("document")}
            name="document"
            value={values.document}
            onChange={handleTextChange("document")}
            ref={(node) => (fieldRefs.current.document = node)}
            aria-invalid={Boolean(errors.document)}
            aria-describedby={describedBy("document")}
          />
          {errors.document && <span id={errorId("document")} className="text-xs text-rose-600" role="alert">{errors.document}</span>}
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("address")}>{t("clients.form.address")}</Label>
          <Input id={inputId("address")} name="address" value={values.address} onChange={handleTextChange("address")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("phone")}>{t("clients.table.phone")}</Label>
          <Input
            id={inputId("phone")}
            name="phone"
            value={values.phone}
            onChange={handleTextChange("phone")}
            ref={(node) => (fieldRefs.current.phone = node)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone")}
          />
          {errors.phone && <span id={errorId("phone")} className="text-xs text-rose-600" role="alert">{errors.phone}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("email")}>{t("clients.table.email")}</Label>
          <Input
            id={inputId("email")}
            name="email"
            type="email"
            value={values.email}
            onChange={handleTextChange("email")}
            ref={(node) => (fieldRefs.current.email = node)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errors.email && <span id={errorId("email")} className="text-xs text-rose-600" role="alert">{errors.email}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("plan")}>{t("clients.table.plan")}</Label>
          <div ref={planContainerRef} className="relative">
            <Input
              id={inputId("plan")}
              name="planSearch"
              value={planQuery}
              onChange={handlePlanChange}
              onFocus={() => setPlanOpen(true)}
              placeholder="Selecciona o escribe para filtrar..."
              ref={(node) => (fieldRefs.current.planId = node)}
              aria-invalid={Boolean(errors.planId)}
              aria-describedby={describedBy("planId")}
              autoComplete="off"
              className="pr-8"
            />
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {planOpen ? (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredPlanOptions.length > 0 ? (
                  <ul className="py-1">
                    {filteredPlanOptions.map((plan) => (
                      <li key={plan.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            handleSelectPlan(plan)
                          }}
                        >
                          {plan.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                )}
              </div>
            ) : null}
          </div>
          {errors.planId && <span id={errorId("planId")} className="text-xs text-rose-600" role="alert">{errors.planId}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("ipAddress")}>{t("clients.table.ip")}</Label>
          <Input
            id={inputId("ipAddress")}
            name="ipAddress"
            value={values.ipAddress}
            onChange={handleTextChange("ipAddress")}
            ref={(node) => (fieldRefs.current.ipAddress = node)}
            aria-invalid={Boolean(errors.ipAddress)}
            aria-describedby={describedBy("ipAddress")}
          />
          {errors.ipAddress && <span id={errorId("ipAddress")} className="text-xs text-rose-600" role="alert">{errors.ipAddress}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("clients.table.status")}</Label>
          <select
            id={inputId("status")}
            name="status"
            value={values.status}
            onChange={handleSelectChange("status")}
            className={fieldClass}
            ref={(node) => (fieldRefs.current.status = node)}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={describedBy("status")}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("latitude")}>{t("clients.form.latitude")}</Label>
          <Input id={inputId("latitude")} name="latitude" type="number" step="any" value={values.latitude ?? ""} onChange={handleNumberChange("latitude")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("longitude")}>{t("clients.form.longitude")}</Label>
          <Input id={inputId("longitude")} name="longitude" type="number" step="any" value={values.longitude ?? ""} onChange={handleNumberChange("longitude")} />
        </label>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel ?? t("common.save")}</Button>
      </div>
    </form>
  )
}

export default ClientForm
