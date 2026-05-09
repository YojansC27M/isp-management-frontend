import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import { rescheduleVisit, getVisitById } from "../services/visitsApi"
import type { Visit } from "../types/visit"

const VisitReschedulePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [notes, setNotes] = useState("")

  const loadVisit = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const data = await getVisitById(id)
      setVisit(data)
      setScheduledDate(data.scheduledDate)
      setScheduledTime(data.scheduledTime)
      setNotes(data.notes)
    } catch (err) {
      setError(getErrorMessage(err, t("visits.reschedule.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    void loadVisit()
  }, [loadVisit])

  const summaryItems = useMemo(
    () => [
      { label: t("visits.detail.client"), value: visit?.clientName ?? "" },
      { label: t("visits.detail.technician"), value: visit?.technicianName || t("visits.unassigned") },
      { label: t("visits.detail.type"), value: visit ? t(`visits.form.type.${visit.type}`) : "" },
      { label: t("visits.detail.status"), value: visit ? t(`visits.status.${visit.status}`) : "" },
    ],
    [t, visit],
  )

  const handleSubmit = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await rescheduleVisit(id, {
        scheduledDate,
        scheduledTime,
        notes,
      })
      notify({
        title: t("visits.reschedule.success"),
        description: t("visits.reschedule.successDesc"),
        type: "success",
      })
      navigate(`/visits/${updated.id}`)
    } catch (err) {
      notify({
        title: t("visits.reschedule.errorTitle"),
        description: getErrorMessage(err, t("visits.reschedule.errorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("visits.reschedule.loading")} />
  if (error) return <StateMessage variant="error" title={t("visits.reschedule.loadErrorTitle")} description={error} />
  if (!visit) return <StateMessage variant="empty" title={t("visits.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("visits.rescheduleTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("visits.rescheduleDescription")}</p>
          <p className="mt-2 text-sm font-medium text-primary">{visit.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/visits/${visit.id}`)}>
          {t("visits.reschedule.back")}
        </Button>
      </header>

      {saving ? <StateMessage variant="loading" title={t("visits.reschedule.saving")} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("visits.reschedule.summaryTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {summaryItems.map((item) => (
              <article key={item.label} className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("visits.reschedule.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSubmit()
              }}
            >
            <label className="grid gap-1.5">
              <Label htmlFor="visit-reschedule-date">{t("visits.form.scheduledDate")}</Label>
              <Input
                id="visit-reschedule-date"
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor="visit-reschedule-time">{t("visits.form.scheduledTime")}</Label>
              <Input
                id="visit-reschedule-time"
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor="visit-reschedule-notes">{t("visits.detail.notes")}</Label>
              <textarea
                id="visit-reschedule-notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-28 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit">
                {t("visits.reschedule.save")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/visits/${visit.id}`)}>
                {t("visits.reschedule.cancel")}
              </Button>
            </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VisitReschedulePage
