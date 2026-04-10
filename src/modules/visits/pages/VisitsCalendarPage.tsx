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

const statusOptions: { label: string; value: VisitStatus }[] = [
  { label: "Programada", value: "scheduled" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completada", value: "completed" },
  { label: "Cancelada", value: "canceled" },
]

const inputId = (field: string) => `visits-list-${field}`

const VisitsCalendarPage = () => {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [technicianFilter, setTechnicianFilter] = useState("")
  const [zoneFilter, setZoneFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "">("")
  const [error, setError] = useState("")
  const canManageVisits = useCan("visits.write")

  const loadVisits = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getVisits()
      setVisits(data)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar la agenda de visitas."))
    } finally {
      setLoading(false)
    }
  }, [])

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
        title="Agenda de visitas tecnicas"
        description="Programa, filtra y revisa visitas por tecnico o zona."
        actions={
          <Button
            onClick={() => navigate("/visits/new")}
            disabled={!canManageVisits}
            title={!canManageVisits ? "Tu perfil no tiene permiso para programar visitas." : undefined}
          >
            Programar visita
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-3 md:items-end">
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("technician")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tecnico
            </Label>
            <select
              id={inputId("technician")}
              value={technicianFilter}
              onChange={(event) => setTechnicianFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
              {technicians.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Zona
            </Label>
            <select
              id={inputId("zone")}
              value={zoneFilter}
              onChange={(event) => setZoneFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todas</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as VisitStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
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
        <StateMessage variant="loading" title="Cargando visitas..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar visitas" description={error} />
      ) : filteredVisits.length === 0 ? (
        <StateMessage variant="empty" title="No hay visitas programadas." />
      ) : (
        <VisitsCalendar visits={filteredVisits} onView={(id) => navigate(`/visits/${id}`)} />
      )}
    </div>
  )
}

export default VisitsCalendarPage
