import { useCallback, useEffect, useMemo, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import ClientMapFilters from "../components/ClientMapFilters"
import ClientsMapView from "../components/ClientsMapView"
import { normalizeClientMapFilters, validateClientMapFilters } from "../lib/filters"
import { getClientsMap, getClientsMapByFilters } from "../services/clientsMapApi"
import type { ClientMapFiltersValues, ClientMapItem } from "../types/clientMap"

const initialFilters: ClientMapFiltersValues = {
  status: "",
  zone: "",
  technicianName: "",
  geoMode: "",
  centerLat: "",
  centerLng: "",
  radiusKm: "",
  polygon: "",
}

const ClientsMapPage = () => {
  const { t } = useI18n()
  const [filters, setFilters] = useState<ClientMapFiltersValues>(initialFilters)
  const [clients, setClients] = useState<ClientMapItem[]>([])
  const [zoneOptions, setZoneOptions] = useState<string[]>([])
  const [technicianOptions, setTechnicianOptions] = useState<string[]>([])
  const [filterErrors, setFilterErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFiltersChange = (next: ClientMapFiltersValues) => {
    setFilters(next)
    if (filterErrors.length > 0) setFilterErrors([])
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getClientsMap()
      setClients(data)
      setZoneOptions(
        Array.from(
          new Set(
            data
              .map((client) => client.zone.trim())
              .filter((zone) => zone.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b)),
      )
      setTechnicianOptions(
        Array.from(
          new Set(
            data
              .map((client) => client.technicianName.trim())
              .filter((name) => name.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b)),
      )
    } catch (err) {
      setError(getErrorMessage(err, t("clientsMap.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const applyFilters = async () => {
    const validationErrors = validateClientMapFilters(filters, t)
    setFilterErrors(validationErrors)
    if (validationErrors.length > 0) return

    const normalized = normalizeClientMapFilters(filters)
    setFilters(normalized)

    setLoading(true)
    setError("")
    try {
      const data = await getClientsMapByFilters(normalized)
      setClients(data)
    } catch (err) {
      setError(getErrorMessage(err, t("clientsMap.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = async () => {
    setFilters(initialFilters)
    setFilterErrors([])
    await loadAll()
  }

  const summary = useMemo(
    () =>
      clients.reduce(
        (acc, client) => {
          acc.total += 1
          if (client.status === "active") acc.active += 1
          if (client.status === "suspended") acc.suspended += 1
          if (client.status === "inactive") acc.inactive += 1
          return acc
        },
        { total: 0, active: 0, suspended: 0, inactive: 0 },
      ),
    [clients],
  )

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t("clientsMap.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("clientsMap.description")}</p>
      </header>

      <ClientMapFilters
        values={filters}
        zoneOptions={zoneOptions}
        technicianOptions={technicianOptions}
        errors={filterErrors}
        isSubmitting={loading}
        onChange={handleFiltersChange}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      {loading ? (
        <StateMessage variant="loading" title={t("clientsMap.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("clientsMap.loadErrorTitle")} description={error} />
      ) : clients.length === 0 ? (
        <StateMessage variant="empty" title={t("clientsMap.emptyTitle")} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label={t("clientsMap.summary.total")} value={String(summary.total)} />
            <KpiCard label={t("clientsMap.summary.active")} value={String(summary.active)} />
            <KpiCard label={t("clientsMap.summary.suspended")} value={String(summary.suspended)} />
            <KpiCard label={t("clientsMap.summary.inactive")} value={String(summary.inactive)} />
          </section>
          <ClientsMapView clients={clients} />
        </>
      )}
    </div>
  )
}

export default ClientsMapPage
