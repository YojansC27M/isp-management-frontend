import { useI18n } from "@/i18n/i18nContext"
import KeyValueSummaryGrid, { type KeyValueSummaryItem } from "@/components/shared/KeyValueSummaryGrid"
import type { Visit } from "../types/visit"

interface VisitDetailsCardProps {
  visit: Visit
}

const VisitDetailsCard = ({ visit }: VisitDetailsCardProps) => {
  const { t } = useI18n()
  const visitTypeLabel = t(`visits.form.type.${visit.type}`)

  const items: KeyValueSummaryItem[] = [
    { label: t("visits.detail.client"), value: visit.clientName, valueClassName: "capitalize" },
    { label: t("visits.detail.technician"), value: visit.technicianName || t("visits.unassigned"), valueClassName: "capitalize" },
    { label: t("visits.detail.zone"), value: visit.zone, valueClassName: "capitalize" },
    { label: t("visits.detail.type"), value: visitTypeLabel, valueClassName: "capitalize" },
    { label: t("visits.detail.scheduled"), value: `${visit.scheduledDate} - ${visit.scheduledTime}`, valueClassName: "capitalize" },
    { label: t("visits.detail.status"), value: visit.status.replace("_", " "), valueClassName: "capitalize" },
    { label: t("visits.detail.notes"), value: visit.notes || t("visits.detail.noNotes"), valueClassName: "capitalize" },
  ]

  return <KeyValueSummaryGrid items={items} gridClassName="grid gap-4 sm:grid-cols-2" />
}

export default VisitDetailsCard
