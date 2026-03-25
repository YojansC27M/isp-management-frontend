import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import VisitsCalendar from "../components/VisitsCalendar"
import { getVisits } from "../services/visitsApi"
import type { Visit, VisitStatus } from "../types/visit"

const statusOptions: { label: string; value: VisitStatus }[] = [
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Canceled", value: "canceled" },
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
          <h1>Technical Visits Schedule</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Monitor and schedule technician visits.</p>
        </div>
        <button type="button" onClick={() => navigate("/visits/new")}>
          Schedule Visit
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Technician
          <select value={technicianFilter} onChange={(event) => setTechnicianFilter(event.target.value)}>
            <option value="">All</option>
            {technicians.map((tech) => (
              <option key={tech} value={tech}>
                {tech}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Zone
          <select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)}>
            <option value="">All</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as VisitStatus | "")}>
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading visits...</p>
      ) : filteredVisits.length === 0 ? (
        <p>No visits scheduled.</p>
      ) : (
        <VisitsCalendar visits={filteredVisits} onView={(id) => navigate(`/visits/${id}`)} />
      )}
    </div>
  )
}

export default VisitsCalendarPage
