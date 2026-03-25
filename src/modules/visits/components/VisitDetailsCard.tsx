import type { Visit } from "../types/visit"

interface VisitDetailsCardProps {
  visit: Visit
}

const VisitDetailsCard = ({ visit }: VisitDetailsCardProps) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Client</strong>
        <span>{visit.clientName}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Technician</strong>
        <span>{visit.technicianName}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Zone</strong>
        <span>{visit.zone}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Type</strong>
        <span style={{ textTransform: "capitalize" }}>{visit.type}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Scheduled</strong>
        <span>{visit.scheduledDate} at {visit.scheduledTime}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Status</strong>
        <span style={{ textTransform: "capitalize" }}>{visit.status.replace("_", " ")}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Notes</strong>
        <span>{visit.notes || "No notes"}</span>
      </div>
    </div>
  )
}

export default VisitDetailsCard
