import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/shared/FilterPanel"
import { useI18n } from "@/i18n/i18nContext"
import type { ReportsFiltersValues } from "../types/report"

interface ReportsFiltersProps {
  values: ReportsFiltersValues
  onChange: (values: ReportsFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const inputId = (field: string) => `reports-filters-${field}`

const ReportsFilters = ({ values, onChange, onApply, onClear }: ReportsFiltersProps) => {
  const { t } = useI18n()

  const handleInputChange = (field: keyof ReportsFiltersValues) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      [field]: event.target.value,
    })
  }

  return (
    <FilterPanel>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("dateFrom")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("reports.filters.from")}
          </Label>
          <Input id={inputId("dateFrom")} type="date" value={values.dateFrom} onChange={handleInputChange("dateFrom")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("dateTo")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("reports.filters.to")}
          </Label>
          <Input id={inputId("dateTo")} type="date" value={values.dateTo} onChange={handleInputChange("dateTo")} />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("reports.filters.zone")}
          </Label>
          <Input
            id={inputId("zone")}
            value={values.zone}
            onChange={handleInputChange("zone")}
            placeholder={t("reports.filters.zonePlaceholder")}
          />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("plan")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("reports.filters.plan")}
          </Label>
          <Input
            id={inputId("plan")}
            value={values.plan}
            onChange={handleInputChange("plan")}
            placeholder={t("reports.filters.planPlaceholder")}
          />
        </label>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={onApply}>
            {t("reports.filters.apply")}
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            {t("reports.filters.clear")}
          </Button>
        </div>
      </div>
    </FilterPanel>
  )
}

export default ReportsFilters
