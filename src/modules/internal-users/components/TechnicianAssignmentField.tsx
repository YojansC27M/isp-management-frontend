import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { TechnicianAssignmentOption } from "../types/internalUser"

interface TechnicianAssignmentFieldProps {
  value: string
  options: TechnicianAssignmentOption[]
  zone?: string
  onChange: (technicianId: string) => void
  onAutoAssign: () => void
  autoAssigning?: boolean
  disabled?: boolean
}

const formatAvailability = (options: TechnicianAssignmentOption["availability"]) => {
  if (options.length === 0) return ""
  return options.map((slot) => slot.label).join(" | ")
}

const TechnicianAssignmentField = ({
  value,
  options,
  zone,
  onChange,
  onAutoAssign,
  autoAssigning = false,
  disabled = false,
}: TechnicianAssignmentFieldProps) => {
  const { t } = useI18n()
  const selected = options.find((item) => item.id === value) ?? null
  const availableCount = options.filter((item) => item.availableForContext).length

  return (
    <div className="grid gap-2 rounded-lg border border-border/80 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="technician-assignment-select">{t("visits.detail.technician")}</Label>
        <Button type="button" variant="outline" onClick={onAutoAssign} disabled={autoAssigning || disabled}>
          {autoAssigning ? t("tickets.form.assigning") : t("tickets.form.assignAutomatically")}
        </Button>
      </div>
      <select
        id="technician-assignment-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
      >
        <option value="">{t("visits.unassigned")}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} {option.availableForContext ? "" : `(${option.unavailableReason})`} - {t("tickets.form.load", { load: option.currentLoad })}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {availableCount > 0
          ? t("technicianAssignment.availableCount", { count: availableCount })
          : t("technicianAssignment.noneAvailable")}
      </p>
      {zone && <p className="text-xs text-muted-foreground">{t("technicianAssignment.referenceZone", { zone })}</p>}
      {selected && (
        <div className="grid gap-1 rounded-md border border-border bg-card p-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{t("technicianAssignment.coverage")}:</span>{" "}
            {selected.coverageZones.join(", ") || t("technicianAssignment.noneZones")}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("technicianAssignment.availability")}:</span>{" "}
            {formatAvailability(selected.availability) || t("technicianAssignment.noSlot")}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("technicianAssignment.skills")}:</span>{" "}
            {selected.skills.join(", ") || t("technicianAssignment.noneSkills")}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("internalUsers.table.load")}:</span> {selected.currentLoad}
          </p>
        </div>
      )}
    </div>
  )
}

export default TechnicianAssignmentField
