import { useNavigate } from "react-router-dom"
import ClientForm from "../components/ClientForm"
import { createClient } from "../services/clientsApi"
import type { ClientFormValues } from "../types/client"

const initialValues: ClientFormValues = {
  name: "",
  document: "",
  address: "",
  phone: "",
  email: "",
  plan: "",
  ipAddress: "",
  status: "active",
  latitude: null,
  longitude: null,
}

const ClientCreatePage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (values: ClientFormValues) => {
    await createClient(values)
    navigate("/clients")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Create Client</h1>
        <p style={{ color: "#6b7280" }}>Add a new client to your ISP.</p>
        <button type="button" onClick={() => navigate("/clients")} style={{ width: "fit-content" }}>
          Back to Clients
        </button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  )
}

export default ClientCreatePage
