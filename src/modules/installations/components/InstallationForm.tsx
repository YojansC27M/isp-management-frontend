import { useEffect, useMemo, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import ClientAutocompleteField, { type ClientSummary } from "@/modules/clients/components/ClientAutocompleteField"
import { getClientVisits } from "@/modules/visits/services/visitsApi"
import { getRouters } from "@/modules/routers/services/routersApi"
import type { ManagedRouter } from "@/modules/routers/types/router"
import type { Visit } from "@/modules/visits/types/visit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { InstallationFormValues, InstallationOperationType, InstallationStatus } from "../types/installation"

interface InstallationFormProps {
  initialValues: InstallationFormValues
  onSubmit: (values: InstallationFormValues) => void | Promise<void>
  submitLabel?: string
}

type FormErrors = Partial<Record<keyof InstallationFormValues, string>>

const statusOptions: InstallationStatus[] = ["pending", "scheduled", "installed", "suspended", "canceled"]
const operationTypeOptions: InstallationOperationType[] = ["installation", "relocation", "replacement", "removal"]

const inputId = (field: string) => `installation-form-${field}`
const errorId = (field: string) => `installation-form-${field}-error`
const toDatetimeLocal = (value: string | null | undefined) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const InstallationForm = ({ initialValues, onSubmit, submitLabel }: InstallationFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<InstallationFormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [routers, setRouters] = useState<ManagedRouter[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loadingRouters, setLoadingRouters] = useState(false)
  const [loadingVisits, setLoadingVisits] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    let cancelled = false

    const loadRouters = async () => {
      setLoadingRouters(true)
      try {
        const data = await getRouters()
        if (!cancelled) {
          setRouters(data)
        }
      } catch {
        if (!cancelled) {
          setRouters([])
        }
      } finally {
        if (!cancelled) setLoadingRouters(false)
      }
    }

    void loadRouters()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadVisits = async () => {
      const clientId = values.clientId.trim()
      if (!clientId) {
        setVisits([])
        setLoadingVisits(false)
        return
      }

      setLoadingVisits(true)
      try {
        const data = await getClientVisits(clientId)
        if (!cancelled) {
          setVisits(data)
        }
      } catch {
        if (!cancelled) {
          setVisits([])
        }
      } finally {
        if (!cancelled) setLoadingVisits(false)
      }
    }

    void loadVisits()
    return () => {
      cancelled = true
    }
  }, [values.clientId])

  const routerOptions = useMemo(
    () =>
      [...routers].sort((a, b) => a.name.localeCompare(b.name)).map((router) => ({
        id: router.id,
        label: `${router.name} · ${router.ip} · ${router.zone}`,
      })),
    [routers],
  )

  const visitOptions = useMemo(
    () =>
      [...visits]
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.scheduledTime.localeCompare(a.scheduledTime))
        .map((visit) => ({
          id: visit.id,
          label: `${visit.scheduledDate} ${visit.scheduledTime} · ${t(`visits.status.${visit.status}`)} · ${t(`visits.form.type.${visit.type}`)}`,
        })),
    [t, visits],
  )

  const handleClientSelect = (client: ClientSummary | null) => {
    setValues((current) => ({
      ...current,
      clientId: client?.id ?? "",
      visitId: "",
    }))
  }

  const handleChange =
    (field: keyof InstallationFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
    }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = t("installation.form.error.clientRequired")
    if (!values.routerId.trim()) nextErrors.routerId = t("installation.form.error.routerRequired")
    if (!values.operationType) nextErrors.operationType = t("installation.form.error.operationTypeRequired")
    if (!values.status) nextErrors.status = t("installation.form.error.statusRequired")
    if (values.status === "installed" && !values.installedAt.trim()) {
      nextErrors.installedAt = t("installation.form.error.installedAtRequired")
    }
    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length > 0) return
    void onSubmit({
      clientId: values.clientId.trim(),
      visitId: values.visitId.trim(),
      routerId: values.routerId.trim(),
      operationType: values.operationType,
      status: values.status,
      installedAt: values.installedAt,
      notes: values.notes.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("clientId")}>{t("installation.form.client")}</Label>
          <ClientAutocompleteField
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            onSelect={handleClientSelect}
            ariaInvalid={Boolean(errors.clientId)}
            ariaDescribedBy={errors.clientId ? errorId("clientId") : undefined}
          />
          {errors.clientId ? <span id={errorId("clientId")} className="text-xs text-rose-600">{errors.clientId}</span> : null}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("visitId")}>{t("installation.form.visit")}</Label>
          <select
            id={inputId("visitId")}
            value={values.visitId}
            onChange={handleChange("visitId")}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
            disabled={!values.clientId.trim() || loadingVisits}
          >
            <option value="">{loadingVisits ? t("installation.form.loadingVisits") : t("installation.form.noVisit")}</option>
            {visitOptions.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("routerId")}>{t("installation.form.router")}</Label>
          <select
            id={inputId("routerId")}
            value={values.routerId}
            onChange={handleChange("routerId")}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
            aria-invalid={Boolean(errors.routerId)}
            aria-describedby={errors.routerId ? errorId("routerId") : undefined}
            disabled={loadingRouters}
          >
            <option value="">{loadingRouters ? t("common.loading") : t("installation.form.selectRouter")}</option>
            {routerOptions.map((router) => (
              <option key={router.id} value={router.id}>
                {router.label}
              </option>
            ))}
          </select>
          {errors.routerId ? <span id={errorId("routerId")} className="text-xs text-rose-600">{errors.routerId}</span> : null}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("operationType")}>{t("installation.form.operationType")}</Label>
          <select
            id={inputId("operationType")}
            value={values.operationType}
            onChange={handleChange("operationType")}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
            aria-invalid={Boolean(errors.operationType)}
            aria-describedby={errors.operationType ? errorId("operationType") : undefined}
          >
            {operationTypeOptions.map((operationType) => (
              <option key={operationType} value={operationType}>
                {t(`installation.operationType.${operationType}`)}
              </option>
            ))}
          </select>
          {errors.operationType ? <span id={errorId("operationType")} className="text-xs text-rose-600">{errors.operationType}</span> : null}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("installation.form.status")}</Label>
          <select
            id={inputId("status")}
            value={values.status}
            onChange={handleChange("status")}
            className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? errorId("status") : undefined}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`installation.status.${status}`)}
              </option>
            ))}
          </select>
          {errors.status ? <span id={errorId("status")} className="text-xs text-rose-600">{errors.status}</span> : null}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("installedAt")}>{t("installation.form.installedAt")}</Label>
          <Input
            id={inputId("installedAt")}
            type="datetime-local"
            value={toDatetimeLocal(values.installedAt)}
            onChange={(event) => setValues((current) => ({ ...current, installedAt: event.target.value }))}
            aria-invalid={Boolean(errors.installedAt)}
            aria-describedby={errors.installedAt ? errorId("installedAt") : undefined}
          />
          {errors.installedAt ? <span id={errorId("installedAt")} className="text-xs text-rose-600">{errors.installedAt}</span> : null}
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("notes")}>{t("installation.form.notes")}</Label>
          <textarea
            id={inputId("notes")}
            rows={4}
            value={values.notes}
            onChange={handleChange("notes")}
            className="min-h-24 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel ?? t("common.save")}</Button>
      </div>
    </form>
  )
}

export default InstallationForm
