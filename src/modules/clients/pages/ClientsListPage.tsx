import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ClientsTable from "../components/ClientsTable"
import { deleteClient, getClients } from "../services/clientsApi"
import type { Client, ClientStatus } from "../types/client"

const statusOptions: { label: string; value: ClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Inactivo", value: "inactive" },
]

const ClientsListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("")
  const [planFilter, setPlanFilter] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const plans = useMemo(() => {
    const uniquePlans = new Set(clients.map((client) => client.plan).filter(Boolean))
    return Array.from(uniquePlans)
  }, [clients])

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase()
    return clients.filter((client) => {
      const matchesSearch = [client.name, client.document, client.ipAddress]
        .join(" ")
        .toLowerCase()
        .includes(term)
      const matchesStatus = statusFilter ? client.status === statusFilter : true
      const matchesPlan = planFilter ? client.plan === planFilter : true
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [clients, planFilter, search, statusFilter])

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este cliente?")
    if (!confirmed) return
    await deleteClient(id)
    await loadClients()
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPlanFilter("")
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Clientes</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Administra clientes y planes del ISP.</p>
        </div>
        <button type="button" onClick={() => navigate("/clients/new")}>Crear cliente</button>
      </header>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          type="search"
          placeholder="Buscar por nombre, documento o IP..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 420 }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "")}>
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
            Plan
            <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)}>
              <option value="">Todos</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={clearFilters}>Limpiar filtros</button>
        </div>
      </div>

      {loading ? (
        <p>Cargando clientes...</p>
      ) : filteredClients.length === 0 ? (
        <p>No se encontraron clientes.</p>
      ) : (
        <ClientsTable
          clients={filteredClients}
          onEdit={(id) => navigate(`/clients/${id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default ClientsListPage
