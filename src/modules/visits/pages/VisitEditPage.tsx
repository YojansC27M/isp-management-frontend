import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import VisitForm from "../components/VisitForm"
import { getVisitById, updateVisit } from "../services/visitsApi"
import type { Visit, VisitFormValues } from "../types/visit"

const toFormValues = (visit: Visit): VisitFormValues => ({
  clientId: visit.clientId,
  technicianId: visit.technicianId,
  technicianName: visit.technicianName,
  zone: visit.zone,
  type: visit.type,
  scheduledDate: visit.scheduledDate,
  scheduledTime: visit.scheduledTime,
  status: visit.status,
  notes: visit.notes,
})

const VisitEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadVisit = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const data = await getVisitById(id)
      setVisit(data)
    } catch (err) {
      setError(getErrorMessage(err, t("visits.edit.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadVisit()
  }, [loadVisit])

  const initialValues = useMemo(() => (visit ? toFormValues(visit) : null), [visit])

  const handleSubmit = async (values: VisitFormValues) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateVisit(id, values)
      notify({
        title: t("visits.edit.success"),
        description: t("visits.edit.successDesc"),
        type: "success",
      })
      navigate(`/visits/${updated.id}`)
    } catch (err) {
      notify({
        title: t("visits.edit.errorTitle"),
        description: getErrorMessage(err, t("visits.edit.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("visits.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("visits.edit.loadErrorTitle")} description={error} />
  if (!visit || !initialValues) return <StateMessage variant="empty" title={t("visits.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("visits.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("visits.editDescription")}</p>
          <p className="mt-2 text-sm font-medium text-primary">{visit.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/visits/${visit.id}`)}>
          {t("visits.edit.back")}
        </Button>
      </header>

      {saving ? <StateMessage variant="loading" title={t("visits.edit.saving")} /> : null}
      <VisitForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={t("visits.edit.save")}
        excludeVisitId={visit.id}
      />
    </div>
  )
}

export default VisitEditPage
