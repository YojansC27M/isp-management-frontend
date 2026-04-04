import type { ChangeEvent } from "react"
import type { InvoiceFiltersValues, InvoiceStatus } from "../types/invoice"

interface InvoiceFiltersProps {
  values: InvoiceFiltersValues
  onChange: (values: InvoiceFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const statusOptions: { label: string; value: InvoiceStatus }[] = [
  { label: "Pendiente", value: "pending" },
  { label: "Pagado", value: "paid" },
  { label: "Vencido", value: "overdue" },
]

const InvoiceFilters = ({ values, onChange, onApply, onClear }: InvoiceFiltersProps) => {
  const handleInputChange = (field: keyof InvoiceFiltersValues) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      [field]: event.target.value,
    })
  }

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...values,
      status: event.target.value as InvoiceStatus | "",
    })
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Cliente
        <input value={values.clientName} onChange={handleInputChange("clientName")} placeholder="Nombre del cliente" />
      </label>
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
        Desde
        <input type="date" value={values.dateFrom} onChange={handleInputChange("dateFrom")} />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Hasta
        <input type="date" value={values.dateTo} onChange={handleInputChange("dateTo")} />
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

export default InvoiceFilters
