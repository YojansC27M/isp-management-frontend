import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/shared/FilterPanel"
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

const selectClass =
  "h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `invoice-filters-${field}`

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
    <FilterPanel>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("clientName")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cliente
          </Label>
          <Input id={inputId("clientName")} value={values.clientName} onChange={handleInputChange("clientName")} placeholder="Nombre del cliente" />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estado
          </Label>
          <select id={inputId("status")} value={values.status} onChange={handleStatusChange} className={selectClass}>
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("dateFrom")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Desde
          </Label>
          <Input id={inputId("dateFrom")} type="date" value={values.dateFrom} onChange={handleInputChange("dateFrom")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("dateTo")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Hasta
          </Label>
          <Input id={inputId("dateTo")} type="date" value={values.dateTo} onChange={handleInputChange("dateTo")} />
        </label>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={onApply}>
            Aplicar
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Limpiar
          </Button>
        </div>
      </div>
    </FilterPanel>
  )
}

export default InvoiceFilters
