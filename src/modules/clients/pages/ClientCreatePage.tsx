import { useNavigate } from "react-router-dom"
import ClientForm, { ClientFormValues } from "../components/ClientForm"
import { createClient } from "../services/clientsApi"

const initialValues: ClientFormValues = {
  name: "",
  document: "",
  address: "",
  phone: "",
  email: "",
  plan: "",
  ipAddress: "",
  status: "Active",
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
      <header>
        <h1>Create Client</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Add a new client to your ISP.</p>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  )
}

export default ClientCreatePage
