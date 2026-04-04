import type { Visit } from "../types/visit"

interface VisitsCalendarProps {
  visits: Visit[]
  onView: (id: string) => void
}

const VisitsCalendar = ({ visits, onView }: VisitsCalendarProps) => {
  const grouped = visits.reduce<Record<string, Visit[]>>((acc, visit) => {
    const date = visit.scheduledDate
    if (!acc[date]) acc[date] = []
    acc[date].push(visit)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort()

  if (dates.length === 0) {
    return <p>No hay visitas programadas.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {dates.map((date) => (
        <section key={date} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: 0 }}>{date}</h3>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {grouped[date].map((visit) => (
              <div
                key={visit.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  border: "1px solid #f3f4f6",
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{visit.clientName}</strong>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{visit.technicianName}</span>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {visit.type} - {visit.scheduledTime}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, textTransform: "capitalize" }}>{visit.status.replace("_", " ")}</span>
                  <button type="button" onClick={() => onView(visit.id)}>
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default VisitsCalendar


