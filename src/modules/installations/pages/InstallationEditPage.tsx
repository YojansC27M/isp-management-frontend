import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import InstallationForm from "../components/InstallationForm"
import { deleteInstallation, getInstallationById, updateInstallation } from "../services/installationsApi"
import type { Installation, InstallationFormValues } from "../types/installation"

const toLocalDatetimeValue = (value: string | null | undefined) => {
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

const toFormValues = (installation: Installation): InstallationFormValues => ({
  clientId: installation.clientId,
  visitId: installation.visitId ?? "",
  routerId: installation.routerId ?? "",
  operationType: installation.operationType,
  status: installation.status,
  installedAt: toLocalDatetimeValue(installation.installedAt),
  notes: installation.notes,
})

const InstallationEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify, confirm } = useUI()
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const loadInstallation = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const data = await getInstallationById(id)
      setInstallation(data)
    } catch (err) {
      setError(getErrorMessage(err, t("installation.edit.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadInstallation()
  }, [loadInstallation])

  const initialValues = useMemo(() => (installation ? toFormValues(installation) : null), [installation])

  const handleSubmit = async (values: InstallationFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateInstallation(id, values)
      notify({
        title: t("installation.edit.success"),
        description: t("installation.edit.successDesc"),
        type: "success",
      })
      navigate(`/clients/${updated.clientId}`)
    } catch (err) {
      notify({
        title: t("installation.edit.errorTitle"),
        description: getErrorMessage(err, t("installation.edit.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    const clientId = installation?.clientId
    const accepted = await confirm({
      title: t("installation.delete.title"),
      description: t("installation.delete.description"),
      confirmLabel: t("installation.delete.confirm"),
    })
    if (!accepted) return

    setDeleting(true)
    try {
      await deleteInstallation(id)
      notify({
        title: t("installation.delete.success"),
        type: "success",
      })
      if (clientId) {
        navigate(`/clients/${clientId}`)
      } else {
        navigate("/clients")
      }
    } catch (err) {
      notify({
        title: t("installation.delete.errorTitle"),
        description: getErrorMessage(err, t("installation.delete.errorDesc")),
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("installation.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("installation.edit.loadErrorTitle")} description={error} />
  if (!installation || !initialValues) return <StateMessage variant="empty" title={t("installation.edit.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("installation.edit.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("installation.edit.description")}</p>
          <p className="mt-2 text-sm font-medium text-primary">{installation.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/clients/${installation.clientId}`)}>
            {t("common.back")}
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? t("common.loading") : t("installation.delete.action")}
          </Button>
        </div>
      </header>

      {saving ? <StateMessage variant="loading" title={t("installation.edit.saving")} /> : null}
      <InstallationForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("installation.edit.save")} />
    </div>
  )
}

export default InstallationEditPage
