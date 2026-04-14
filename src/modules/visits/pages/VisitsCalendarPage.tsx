import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import VisitsCalendar from "../components/VisitsCalendar"
import { getVisits } from "../services/visitsApi"
import type { Visit, VisitStatus } from "../types/visit"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"

const inputId = (field: string) => `visits-list-${field}`

const VisitsCalendarPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [technicianFilter, setTechnicianFilter] = useState("")
  const [zoneFilter, setZoneFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "">("")
  const [error, setError] = useState("")
  const canManageVisits = useCan("visits.write")
  const statusOptions: { label: string; value: VisitStatus }[] = [
    { label: t("visits.status.scheduled"), value: "scheduled" },
    { label: t("visits.status.in_progress"), value: "in_progress" },
    { label: t("visits.status.completed"), value: "completed" },
    { label: t("visits.status.canceled"), value: "canceled" },
  ]

  const loadVisits = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getVisits()
      setVisits(data)
    } catch (err) {
      setError(getErrorMessage(err, t("visits.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadVisits()
  }, [loadVisits])

  const technicians = useMemo(() => {
    const unique = new Set(visits.map((visit) => visit.technicianName).filter(Boolean))
    return Array.from(unique)
  }, [visits])

  const zones = useMemo(() => {
    const unique = new Set(visits.map((visit) => visit.zone).filter(Boolean))
    return Array.from(unique)
  }, [visits])

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const matchesTech = technicianFilter ? visit.technicianName === technicianFilter : true
      const matchesZone = zoneFilter ? visit.zone === zoneFilter : true
      const matchesStatus = statusFilter ? visit.status === statusFilter : true
      return matchesTech && matchesZone && matchesStatus
    })
  }, [visits, technicianFilter, zoneFilter, statusFilter])

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("visits.title")}
        description={t("visits.description")}
        actions={
          <Button
            onClick={() => navigate("/visits/new")}
            disabled={!canManageVisits}
            title={!canManageVisits ? t("visits.permissionCreate") : undefined}
          >
            {t("visits.create")}
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("technician")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("visits.filter.technician")}
            </Label>
            <select
              id={inputId("technician")}
              value={technicianFilter}
              onChange={(event) => setTechnicianFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("visits.filter.all")}</option>
              {technicians.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("visits.filter.zone")}
            </Label>
            <select
              id={inputId("zone")}
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("visits.filter.all")}</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("visits.filter.status")}
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as VisitStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("visits.filter.all")}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("visits.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("visits.loadErrorTitle")} description={error} />
      ) : filteredVisits.length === 0 ? (
        <StateMessage variant="empty" title={t("visits.emptyTitle")} />
      ) : (
        <VisitsCalendar visits={filteredVisits} onView={(id) => navigate(`/visits/${id}`)} />
      )}
    </div>
  )
}

export default VisitsCalendarPage
