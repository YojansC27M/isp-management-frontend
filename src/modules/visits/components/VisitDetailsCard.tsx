import type { Visit } from "../types/visit"

interface VisitDetailsCardProps {
  visit: Visit
}

const VisitDetailsCard = ({ visit }: VisitDetailsCardProps) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Cliente</strong>
        <span>{visit.clientName}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Técnico</strong>
        <span>{visit.technicianName}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Zona</strong>
        <span>{visit.zone}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Tipo</strong>
        <span style={{ textTransform: "capitalize" }}>{visit.type}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Programado</strong>
        <span>{visit.scheduledDate} a las {visit.scheduledTime}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Estado</strong>
        <span style={{ textTransform: "capitalize" }}>{visit.status.replace("_", " ")}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Notas</strong>
        <span>{visit.notes || "Sin notas"}</span>
      </div>
    </div>
  )
}

export default VisitDetailsCard
