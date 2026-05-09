import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import InstallationForm from "../components/InstallationForm"
import { createInstallation } from "../services/installationsApi"
import type { InstallationFormValues } from "../types/installation"

interface InstallationCreateLocationState {
  clientId?: string
  clientName?: string
  visitId?: string
  visitLabel?: string
}

const toLocalDatetimeValue = (value: Date = new Date()) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  const hours = String(value.getHours()).padStart(2, "0")
  const minutes = String(value.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const InstallationCreatePage = () => {
  const { t } = useI18n()
  const { notify } = useUI()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as InstallationCreateLocationState | null) ?? null

  const initialValues = useMemo<InstallationFormValues>(
    () => ({
      clientId: state?.clientId ?? "",
      visitId: state?.visitId ?? "",
      routerId: "",
      operationType: "installation",
      status: "installed",
      installedAt: toLocalDatetimeValue(),
      notes: "",
    }),
    [state?.clientId, state?.visitId],
  )

  const handleSubmit = async (values: InstallationFormValues) => {
    try {
      const created = await createInstallation(values)
      notify({
        title: t("installation.create.success"),
        description: t("installation.create.successDesc"),
        type: "success",
      })
      navigate(`/clients/${created.clientId}`)
    } catch (err) {
      notify({
        title: t("installation.create.errorTitle"),
        description: getErrorMessage(err, t("installation.create.errorDesc")),
        type: "error",
      })
    }
  }

  if (!state?.clientId && !state?.visitId) {
    return (
      <div className="grid gap-4">
        <StateMessage variant="empty" title={t("installation.create.emptyTitle")} description={t("installation.create.emptyDesc")} />
        <div>
          <Button variant="outline" onClick={() => navigate("/clients")}>
            {t("clients.title")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t("installation.create.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("installation.create.description")}</p>
        {state?.clientName ? <p className="mt-2 text-sm font-medium text-primary">{state.clientName}</p> : null}
        {state?.visitLabel ? <p className="mt-1 text-sm text-muted-foreground">{state.visitLabel}</p> : null}
      </header>

      <InstallationForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("installation.create.save")} />
    </div>
  )
}

export default InstallationCreatePage
