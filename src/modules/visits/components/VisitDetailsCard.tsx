import KeyValueSummaryGrid, { type KeyValueSummaryItem } from "@/components/shared/KeyValueSummaryGrid"
import type { Visit } from "../types/visit"

interface VisitDetailsCardProps {
  visit: Visit
}

const VisitDetailsCard = ({ visit }: VisitDetailsCardProps) => {
  const items: KeyValueSummaryItem[] = [
    { label: "Cliente", value: visit.clientName, valueClassName: "capitalize" },
    { label: "Tecnico", value: visit.technicianName, valueClassName: "capitalize" },
    { label: "Zona", value: visit.zone, valueClassName: "capitalize" },
    { label: "Tipo", value: visit.type, valueClassName: "capitalize" },
    { label: "Programado", value: `${visit.scheduledDate} - ${visit.scheduledTime}`, valueClassName: "capitalize" },
    { label: "Estado", value: visit.status.replace("_", " "), valueClassName: "capitalize" },
    { label: "Notas", value: visit.notes || "Sin notas", valueClassName: "capitalize" },
  ]

  return <KeyValueSummaryGrid items={items} gridClassName="grid gap-4 sm:grid-cols-2" />
}

export default VisitDetailsCard

