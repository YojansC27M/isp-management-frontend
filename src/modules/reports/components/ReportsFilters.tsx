import type { ChangeEvent } from "react"
import type { ReportsFiltersValues } from "../types/report"

interface ReportsFiltersProps {
  values: ReportsFiltersValues
  onChange: (values: ReportsFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const ReportsFilters = ({ values, onChange, onApply, onClear }: ReportsFiltersProps) => {
  const handleInputChange = (field: keyof ReportsFiltersValues) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      [field]: event.target.value,
    })
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Desde
        <input type="date" value={values.dateFrom} onChange={handleInputChange("dateFrom")} />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Hasta
        <input type="date" value={values.dateTo} onChange={handleInputChange("dateTo")} />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Zona
        <input value={values.zone} onChange={handleInputChange("zone")} placeholder="Zona" />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Plan
        <input value={values.plan} onChange={handleInputChange("plan")} placeholder="Plan" />
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

export default ReportsFilters
