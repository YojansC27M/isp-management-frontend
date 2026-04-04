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
        <h1>Crear cliente</h1>
        <p style={{ color: "#6b7280" }}>Agrega un nuevo cliente a tu ISP.</p>
        <button type="button" onClick={() => navigate("/clients")} style={{ width: "fit-content" }}>
          Volver a Clientes
        </button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear" />
    </div>
  )
}

export default ClientCreatePage
