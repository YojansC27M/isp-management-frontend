import type { ChangeEvent } from "react"
import type { InvoiceFiltersValues, InvoiceStatus } from "../types/invoice"

interface InvoiceFiltersProps {
  values: InvoiceFiltersValues
  onChange: (values: InvoiceFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const statusOptions: { label: string; value: InvoiceStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
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
        Client
        <input value={values.clientName} onChange={handleInputChange("clientName")} placeholder="Client name" />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Status
        <select value={values.status} onChange={handleStatusChange}>
          <option value="">All</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Date From
        <input type="date" value={values.dateFrom} onChange={handleInputChange("dateFrom")} />
      </label>
      <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
        Date To
        <input type="date" value={values.dateTo} onChange={handleInputChange("dateTo")} />
      </label>
      <button type="button" onClick={onApply}>
        Apply Filters
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}

export default InvoiceFilters
