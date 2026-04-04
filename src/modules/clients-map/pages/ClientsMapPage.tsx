import { useCallback, useEffect, useState } from "react"
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
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <h1>Mapa de clientes</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Visualiza clientes por ubicación y estado.</p>
      </header>

      <ClientMapFilters values={filters} onChange={setFilters} onApply={applyFilters} onClear={clearFilters} />

      {loading ? (
        <p>Cargando clientes...</p>
      ) : clients.length === 0 ? (
        <p>No se encontraron clientes.</p>
      ) : (
        <ClientsMapView clients={clients} />
      )}
    </div>
  )
}

export default ClientsMapPage
