import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
  if (options.length === 0) return "Sin franja definida"
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
  const selected = options.find((item) => item.id === value) ?? null
  const availableCount = options.filter((item) => item.availableForContext).length

  return (
    <div className="grid gap-2 rounded-lg border border-border/80 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="technician-assignment-select">Tecnico asignado</Label>
        <Button type="button" variant="outline" onClick={onAutoAssign} disabled={autoAssigning || disabled}>
          {autoAssigning ? "Asignando..." : "Asignar automaticamente"}
        </Button>
      </div>
      <select
        id="technician-assignment-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
      >
        <option value="">Sin asignar</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} {option.availableForContext ? "" : `(${option.unavailableReason})`} - carga {option.currentLoad}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {availableCount > 0
          ? `Tecnicos disponibles para este contexto: ${availableCount}.`
          : "No hay tecnicos disponibles para este contexto. Puedes guardar como sin asignar."}
      </p>
      {zone && <p className="text-xs text-muted-foreground">Zona de referencia: {zone}</p>}
      {selected && (
        <div className="grid gap-1 rounded-md border border-border bg-card p-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Cobertura:</span> {selected.coverageZones.join(", ") || "Sin zonas"}
          </p>
          <p>
            <span className="font-medium text-foreground">Disponibilidad:</span> {formatAvailability(selected.availability)}
          </p>
          <p>
            <span className="font-medium text-foreground">Habilidades:</span> {selected.skills.join(", ") || "Sin habilidades"}
          </p>
          <p>
            <span className="font-medium text-foreground">Carga actual:</span> {selected.currentLoad}
          </p>
        </div>
      )}
    </div>
  )
}

export default TechnicianAssignmentField
