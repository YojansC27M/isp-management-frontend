import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ClientForm from "../components/ClientForm"
import { getClientById, updateClient } from "../services/clientsApi"
import type { ClientFormValues } from "../types/client"

const ClientEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [initialValues, setInitialValues] = useState<ClientFormValues | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return
      setLoading(true)
      try {
        const client = await getClientById(id)
        const { name, document, address, phone, email, plan, ipAddress, status, latitude, longitude } = client
        setInitialValues({ name, document, address, phone, email, plan, ipAddress, status, latitude, longitude })
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [id])

  const handleSubmit = async (values: ClientFormValues) => {
    if (!id) return
    await updateClient(id, values)
    navigate("/clients")
  }

  if (loading) {
    return <p>Loading client...</p>
  }

  if (!initialValues) {
    return <p>Client not found.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Edit Client</h1>
        <p style={{ color: "#6b7280" }}>Update client information.</p>
        <button type="button" onClick={() => navigate("/clients")} style={{ width: "fit-content" }}>
          Back to Clients
        </button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Update" />
    </div>
  )
}

export default ClientEditPage
