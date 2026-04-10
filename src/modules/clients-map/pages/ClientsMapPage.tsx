import { useCallback, useEffect, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
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
        <h1 className="text-2xl font-semibold text-foreground">Mapa de clientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visualiza clientes por ubicacion, estado y tecnico asignado.</p>
      </header>

      <ClientMapFilters values={filters} onChange={setFilters} onApply={applyFilters} onClear={clearFilters} />

      {loading ? (
        <StateMessage variant="loading" title="Cargando clientes..." />
      ) : clients.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron clientes." />
      ) : (
        <ClientsMapView clients={clients} />
      )}
    </div>
  )
}

export default ClientsMapPage
