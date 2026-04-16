import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/shared/FilterPanel"
import { useI18n } from "@/i18n/i18nContext"
import type { ClientMapFiltersValues, ClientMapStatus } from "../types/clientMap"

interface ClientMapFiltersProps {
  values: ClientMapFiltersValues
  onChange: (values: ClientMapFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const statusOptions: { key: string; value: ClientMapStatus }[] = [
  { key: "clients.status.active", value: "active" },
  { key: "clients.status.suspended", value: "suspended" },
  { key: "clients.status.inactive", value: "inactive" },
]

const inputId = (field: string) => `clients-map-filters-${field}`

const ClientMapFilters = ({ values, onChange, onApply, onClear }: ClientMapFiltersProps) => {
  const { t } = useI18n()

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
    <FilterPanel>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.status")}
          </Label>
          <select
            id={inputId("status")}
            value={values.status}
            onChange={handleStatusChange}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
          >
            <option value="">{t("clientsMap.filters.all")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.zone")}
          </Label>
          <Input
            id={inputId("zone")}
            value={values.zone}
            onChange={handleInputChange("zone")}
            placeholder={t("clientsMap.filters.zonePlaceholder")}
          />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("technician")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.technician")}
          </Label>
          <Input
            id={inputId("technician")}
            value={values.technicianName}
            onChange={handleInputChange("technicianName")}
            placeholder={t("clientsMap.filters.technicianPlaceholder")}
          />
        </label>
        <Button variant="outline" onClick={onClear}>
          {t("clientsMap.filters.clear")}
        </Button>
        <Button onClick={onApply}>{t("clientsMap.filters.apply")}</Button>
      </div>
    </FilterPanel>
  )
}

export default ClientMapFilters
