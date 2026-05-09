import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, CalendarClock, CalendarDays, MessageSquare, Pencil, PlusCircle, Ticket, Trash2 } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KeyValueSummaryGrid from "@/components/shared/KeyValueSummaryGrid"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getClientInstallation } from "@/modules/installations/services/installationsApi"
import { deleteVisit, getVisitById } from "../services/visitsApi"
import type { Visit } from "../types/visit"

const statusTone: Record<Visit["status"], string> = {
  scheduled: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  in_progress: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  completed: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  canceled: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
}

const VisitDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify, confirm } = useUI()
  const canCreateTickets = useCan("tickets.write")
  const canManageVisits = useCan("visits.write")
  const [visit, setVisit] = useState<Visit | null>(null)
  const [installationExists, setInstallationExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadVisit = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      setInstallationExists(false)
      try {
        const data = await getVisitById(id)
        setVisit(data)
        const installation = await getClientInstallation(data.clientId)
        setInstallationExists(Boolean(installation))
      } catch (err) {
        const message = getErrorMessage(err, t("visits.detail.loadErrorDefault"))
        setError(message)
        notify({
          title: t("visits.detail.loadErrorTitle"),
          description: message,
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadVisit()
  }, [id, notify, t])

  const visitTypeLabel = visit ? t(`visits.form.type.${visit.type}`) : ""

  const timelineItems = useMemo(
    () => [
      { label: t("visits.detail.scheduled"), value: `${visit?.scheduledDate ?? ""} ${visit?.scheduledTime ?? ""}` },
      { label: t("visits.detail.status"), value: visit ? t(`visits.status.${visit.status}`) : "" },
      { label: t("visits.detail.type"), value: visitTypeLabel },
      { label: t("visits.detail.technicianInfo"), value: visit?.technicianName || t("visits.unassigned") },
      {
        label: t("visits.detail.recommendedAction"),
        value: visit?.status === "completed" ? t("visits.detail.noNotes") : t("visits.detail.createTicket"),
      },
    ],
    [t, visit, visitTypeLabel],
  )

  const handleDelete = async () => {
    if (!visit || !canManageVisits) return
    const accepted = await confirm({
      title: t("visits.detail.deleteTitle"),
      description: t("visits.detail.deleteDescription"),
      confirmLabel: t("visits.detail.deleteConfirm"),
    })
    if (!accepted) return

    setDeleting(true)
    try {
      await deleteVisit(visit.id)
      notify({
        title: t("visits.detail.deleted"),
        type: "success",
      })
      navigate("/visits")
    } catch (err) {
      notify({
        title: t("visits.detail.deleteErrorTitle"),
        description: getErrorMessage(err, t("visits.detail.deleteErrorDesc")),
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("visits.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("visits.detail.loadErrorTitle")} description={error} />
  if (!visit) return <StateMessage variant="empty" title={t("visits.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("visits.detail.title")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{visit.clientName}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">
                {visit.zone} - {visitTypeLabel}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone[visit.status]}`}>
              {t(`visits.status.${visit.status}`)}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[380px] lg:grid-cols-2">
            <Button className="bg-white text-slate-900 hover:bg-cyan-50" onClick={() => navigate(`/clients/${visit.clientId}`)}>
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              {t("visits.detail.openClient")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canCreateTickets}
              title={!canCreateTickets ? t("tickets.permissionCreate") : undefined}
              onClick={() => navigate("/tickets/new", { state: { clientId: visit.clientId, clientName: visit.clientName } })}
            >
              <Ticket className="mr-2 h-4 w-4" />
              {t("visits.detail.createTicket")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManageVisits}
              title={!canManageVisits ? t("visits.permissionManage") : undefined}
              onClick={() => navigate(`/visits/${visit.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("visits.detail.edit")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManageVisits}
              title={!canManageVisits ? t("visits.permissionManage") : undefined}
              onClick={() => navigate(`/visits/${visit.id}/reschedule`)}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              {t("visits.detail.reschedule")}
            </Button>
            {visit.type === "installation" ? (
              <Button
                variant="outline"
                className="border-white/35 bg-white/5 text-white hover:bg-white/10"
                disabled={!canManageVisits || visit.status !== "completed" || installationExists}
                title={
                  !canManageVisits
                    ? t("visits.permissionManage")
                    : visit.status !== "completed"
                      ? t("installation.create.requireCompletedVisit")
                      : installationExists
                        ? t("installation.create.existsForClient")
                        : undefined
                }
                onClick={() =>
                  navigate("/installations/new", {
                    state: {
                      clientId: visit.clientId,
                      clientName: visit.clientName,
                      visitId: visit.id,
                      visitLabel: `${visit.scheduledDate} ${visit.scheduledTime} - ${visit.zone}`,
                    },
                  })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("visits.detail.registerInstallation")}
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canManageVisits || deleting}
              title={!canManageVisits ? t("visits.permissionManage") : undefined}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? t("common.loading") : t("visits.detail.delete")}
            </Button>
            <Button variant="outline" className="border-white/35 bg-white/5 text-white hover:bg-white/10" onClick={() => navigate("/visits")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("visits.detail.back")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("visits.detail.status")} value={t(`visits.status.${visit.status}`)} />
        <KpiCard label={t("visits.detail.technicianInfo")} value={visit.technicianName || t("visits.unassigned")} />
        <KpiCard label={t("visits.detail.zone")} value={visit.zone} />
        <KpiCard label={t("visits.detail.type")} value={visitTypeLabel} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <KeyValueSummaryGrid
          items={[
            { label: t("visits.detail.client"), value: visit.clientName },
            { label: t("visits.detail.technician"), value: visit.technicianName || t("visits.unassigned") },
            { label: t("visits.detail.zone"), value: visit.zone },
            { label: t("visits.detail.type"), value: visitTypeLabel },
            { label: t("visits.detail.scheduled"), value: `${visit.scheduledDate} - ${visit.scheduledTime}` },
            { label: t("visits.detail.status"), value: t(`visits.status.${visit.status}`) },
          ]}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("visits.detail.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {timelineItems.map((item) => (
              <article key={item.label} className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("visits.detail.timeline")}</CardTitle>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {visit.notes || t("visits.detail.noNotes")}
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: t("visits.detail.client"), value: visit.clientName },
              { label: t("visits.detail.technician"), value: visit.technicianName || t("visits.unassigned") },
              { label: t("visits.detail.zone"), value: visit.zone },
              { label: t("visits.detail.type"), value: visitTypeLabel },
              { label: t("visits.detail.scheduled"), value: `${visit.scheduledDate} ${visit.scheduledTime}` },
              { label: t("visits.detail.notes"), value: visit.notes || t("visits.detail.noNotes") },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-foreground">{item.value}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VisitDetailPage
