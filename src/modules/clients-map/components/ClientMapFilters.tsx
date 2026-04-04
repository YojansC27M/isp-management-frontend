import type { ChangeEvent } from "react"
import type { ClientMapFiltersValues, ClientMapStatus } from "../types/clientMap"

interface ClientMapFiltersProps {
  values: ClientMapFiltersValues
  onChange: (values: ClientMapFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const statusOptions: { label: string; value: ClientMapStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Inactivo", value: "inactive" },
]

const ClientMapFilters = ({ values, onChange, onApply, onClear }: ClientMapFiltersProps) => {
  const handleInputChange = (field: keyof ClientMapFiltersValues) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      [field]: event.target.value,
    })
  }

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...values,
      status: event.target.value as ClientMapStatus | "",
    })
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Estado
        <select value={values.status} onChange={handleStatusChange}>
          <option value="">Todos</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Zona
        <input value={values.zone} onChange={handleInputChange("zone")} placeholder="Zona" />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Técnico
        <input
          value={values.technicianName}
          onChange={handleInputChange("technicianName")}
          placeholder="Técnico"
        />
      </label>
      <button type="button" onClick={onApply}>
        Aplicar filtros
      </button>
      <button type="button" onClick={onClear}>
        Limpiar
      </button>
    </div>
  )
}

export default ClientMapFilters
