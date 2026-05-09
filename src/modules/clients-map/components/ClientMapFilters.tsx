import type { ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FilterPanel from "@/components/shared/FilterPanel"
import { useI18n } from "@/i18n/i18nContext"
import type { ClientMapFiltersValues, ClientMapStatus, GeoFilterMode } from "../types/clientMap"

interface ClientMapFiltersProps {
  values: ClientMapFiltersValues
  zoneOptions: string[]
  technicianOptions: string[]
  errors?: string[]
  isSubmitting?: boolean
  onChange: (values: ClientMapFiltersValues) => void
  onApply: () => void
  onClear: () => void
}

const statusOptions: { key: string; value: ClientMapStatus }[] = [
  { key: "clients.status.active", value: "active" },
  { key: "clients.status.suspended", value: "suspended" },
  { key: "clients.status.inactive", value: "inactive" },
]

const geoModeOptions: Array<{ labelKey: string; value: GeoFilterMode }> = [
  { labelKey: "clientsMap.filters.geo.none", value: "" },
  { labelKey: "clientsMap.filters.geo.radius", value: "radius" },
  { labelKey: "clientsMap.filters.geo.polygon", value: "polygon" },
]

const inputId = (field: string) => `clients-map-filters-${field}`

const ClientMapFilters = ({
  values,
  zoneOptions,
  technicianOptions,
  errors = [],
  isSubmitting = false,
  onChange,
  onApply,
  onClear,
}: ClientMapFiltersProps) => {
  const { t } = useI18n()

  const handleInputChange = (field: keyof ClientMapFiltersValues) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...values,
      [field]: event.target.value,
    })
  }

  const handleTextAreaChange = (field: keyof ClientMapFiltersValues) => (event: ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleGeoModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as GeoFilterMode
    onChange({
      ...values,
      geoMode: nextMode,
      ...(nextMode !== "radius" ? { centerLat: "", centerLng: "", radiusKm: "" } : {}),
      ...(nextMode !== "polygon" ? { polygon: "" } : {}),
    })
  }

  return (
    <FilterPanel>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] xl:items-end">
        <label className="grid min-w-0 gap-1.5">
          <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.status")}
          </Label>
          <select
            id={inputId("status")}
            value={values.status}
            onChange={handleStatusChange}
            className="h-8 w-full min-w-0 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
          >
            <option value="">{t("clientsMap.filters.all")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid min-w-0 gap-1.5">
          <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.zone")}
          </Label>
          <select
            id={inputId("zone")}
            value={values.zone}
            onChange={(event) =>
              onChange({
                ...values,
                zone: event.target.value,
              })
            }
            className="h-8 w-full min-w-0 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
          >
            <option value="">{t("clientsMap.filters.all")}</option>
            {zoneOptions.map((zoneOption) => (
              <option key={zoneOption} value={zoneOption}>
                {zoneOption}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Zona operativa (derivada de ultima visita o direccion). No se calcula por latitud/longitud.
          </p>
        </label>

        <label className="grid min-w-0 gap-1.5">
          <Label htmlFor={inputId("technician")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.technician")}
          </Label>
          <Input
            id={inputId("technician")}
            value={values.technicianName}
            onChange={handleInputChange("technicianName")}
            placeholder={t("clientsMap.filters.technicianPlaceholder")}
            list={inputId("technician-options")}
            autoComplete="off"
          />
          <datalist id={inputId("technician-options")}>
            {technicianOptions.map((technician) => (
              <option key={technician} value={technician} />
            ))}
          </datalist>
        </label>

        <label className="grid min-w-0 gap-1.5">
          <Label htmlFor={inputId("geo-mode")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("clientsMap.filters.geoMode")}
          </Label>
          <select
            id={inputId("geo-mode")}
            value={values.geoMode}
            onChange={handleGeoModeChange}
            className="h-8 w-full min-w-0 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
          >
            {geoModeOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <Button className="w-full xl:w-auto" variant="outline" onClick={onClear} disabled={isSubmitting}>
          {t("clientsMap.filters.clear")}
        </Button>
        <Button className="w-full xl:w-auto" onClick={onApply} disabled={isSubmitting}>
          {t("clientsMap.filters.apply")}
        </Button>
      </div>

      {errors.length > 0 ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm text-rose-700" role="alert">
          <p className="font-medium">{t("clientsMap.validation.title")}</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {values.geoMode === "radius" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("center-lat")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Latitud centro
            </Label>
            <Input
              id={inputId("center-lat")}
              value={values.centerLat}
              onChange={handleInputChange("centerLat")}
              placeholder="Ej: 4.711"
            />
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("center-lng")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Longitud centro
            </Label>
            <Input
              id={inputId("center-lng")}
              value={values.centerLng}
              onChange={handleInputChange("centerLng")}
              placeholder="Ej: -74.0721"
            />
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("radius-km")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Radio (km)
            </Label>
            <Input
              id={inputId("radius-km")}
              value={values.radiusKm}
              onChange={handleInputChange("radiusKm")}
              placeholder="Ej: 3"
            />
          </label>
        </div>
      ) : null}

      {values.geoMode === "polygon" ? (
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor={inputId("polygon")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Poligono (lat,lng;lat,lng;lat,lng...)
          </Label>
          <textarea
            id={inputId("polygon")}
            value={values.polygon}
            onChange={handleTextAreaChange("polygon")}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground"
            placeholder="4.72,-74.09;4.70,-74.05;4.68,-74.08"
          />
          <p className="text-xs text-muted-foreground">Minimo 3 puntos. El orden puede ser horario o antihorario.</p>
        </div>
      ) : null}
    </FilterPanel>
  )
}

export default ClientMapFilters
