import { useCallback, useEffect, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import ClientMapFilters from "../components/ClientMapFilters"
import ClientsMapView from "../components/ClientsMapView"
import { getClientsMap, getClientsMapByFilters } from "../services/clientsMapApi"
import type { ClientMapFiltersValues, ClientMapItem } from "../types/clientMap"

const initialFilters: ClientMapFiltersValues = {
  status: "",
  zone: "",
  technicianName: "",
}

const ClientsMapPage = () => {
  const { t } = useI18n()
  const [filters, setFilters] = useState<ClientMapFiltersValues>(initialFilters)
  const [clients, setClients] = useState<ClientMapItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClientsMap()
      setClients(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const applyFilters = async () => {
    setLoading(true)
    try {
      const data = await getClientsMapByFilters(filters)
      setClients(data)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = async () => {
    setFilters(initialFilters)
    await loadAll()
  }

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t("clientsMap.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("clientsMap.description")}</p>
      </header>

      <ClientMapFilters values={filters} onChange={setFilters} onApply={applyFilters} onClear={clearFilters} />

      {loading ? (
        <StateMessage variant="loading" title={t("clientsMap.loading")} />
      ) : clients.length === 0 ? (
        <StateMessage variant="empty" title={t("clientsMap.emptyTitle")} />
      ) : (
        <ClientsMapView clients={clients} />
      )}
    </div>
  )
}

export default ClientsMapPage
