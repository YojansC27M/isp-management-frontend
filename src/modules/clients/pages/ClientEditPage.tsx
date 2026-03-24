import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ClientForm, { ClientFormValues } from "../components/ClientForm"
import { getClientById, updateClient } from "../services/clientsApi"

const ClientEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [initialValues, setInitialValues] = useState<ClientFormValues | null>(null)

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return
      const client = await getClientById(id)
      const { name, document, address, phone, email, plan, ipAddress, status, latitude, longitude } = client
      setInitialValues({ name, document, address, phone, email, plan, ipAddress, status, latitude, longitude })
    }

    loadClient()
  }, [id])

  const handleSubmit = async (values: ClientFormValues) => {
    if (!id) return
    await updateClient(id, values)
    navigate("/clients")
  }

  if (!initialValues) {
    return <p>Loading client...</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header>
        <h1>Edit Client</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Update client information.</p>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Update" />
    </div>
  )
}

export default ClientEditPage
