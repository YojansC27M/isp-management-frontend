import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ClientsTable from "../components/ClientsTable"
import type { Client } from "../types/client"

const mockClients: Client[] = [
  {
    id: "1",
    name: "Maria Lopez",
    document: "DNI 12345678",
    address: "Av. Principal 123",
    phone: "+51 999 123 456",
    email: "maria@example.com",
    plan: "Fiber 300",
    ipAddress: "192.168.0.10",
    status: "Active",
    latitude: -12.0464,
    longitude: -77.0428,
  },
  {
    id: "2",
    name: "Carlos Vega",
    document: "DNI 87654321",
    address: "Jr. Secundario 456",
    phone: "+51 988 555 222",
    email: "carlos@example.com",
    plan: "Fiber 600",
    ipAddress: "192.168.0.11",
    status: "Suspended",
    latitude: -12.05,
    longitude: -77.03,
  },
]

const ClientsListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [clients, setClients] = useState<Client[]>(mockClients)

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase()
    return clients.filter((client) =>
      [client.name, client.document, client.phone, client.plan, client.status]
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
  }, [clients, search])

  const handleDelete = (id: string) => {
    setClients((current) => current.filter((client) => client.id !== id))
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Clients</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Manage your ISP clients and plans.</p>
        </div>
        <button type="button" onClick={() => navigate("/clients/new")}>Create Client</button>
      </header>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search clients..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ flex: 1 }}
        />
      </div>
      <ClientsTable
        clients={filteredClients}
        onEdit={(id) => navigate(`/clients/${id}/edit`)}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default ClientsListPage
