import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import VisitsCalendar from "../components/VisitsCalendar"
import { getVisits } from "../services/visitsApi"
import type { Visit, VisitStatus } from "../types/visit"

const statusOptions: { label: string; value: VisitStatus }[] = [
  { label: "Programada", value: "scheduled" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completada", value: "completed" },
  { label: "Cancelada", value: "canceled" },
]

const VisitsCalendarPage = () => {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)
  const [technicianFilter, setTechnicianFilter] = useState("")
  const [zoneFilter, setZoneFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<VisitStatus | "">("")

  const loadVisits = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getVisits()
      setVisits(data)
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
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Agenda de visitas técnicas</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Monitorea y agenda visitas técnicas.</p>
        </div>
        <button type="button" onClick={() => navigate("/visits/new")}>
          Programar visita
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Técnico
          <select value={technicianFilter} onChange={(event) => setTechnicianFilter(event.target.value)}>
            <option value="">Todos</option>
            {technicians.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Zona
          <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
            <option value="">Todos</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Estado
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as VisitStatus | "")}>
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Cargando visitas...</p>
      ) : filteredVisits.length === 0 ? (
        <p>No hay visitas programadas.</p>
      ) : (
        <VisitsCalendar visits={filteredVisits} onView={(id) => navigate(`/visits/${id}`)} />
      )}
    </div>
  )
}

export default VisitsCalendarPage
