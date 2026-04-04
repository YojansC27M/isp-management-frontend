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
    return <p>Cargando cliente...</p>
  }

  if (!initialValues) {
    return <p>Cliente no encontrado.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Editar cliente</h1>
        <p style={{ color: "#6b7280" }}>Actualiza la información del cliente.</p>
        <button type="button" onClick={() => navigate("/clients")} style={{ width: "fit-content" }}>
          Volver a Clientes
        </button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Actualizar" />
    </div>
  )
}

export default ClientEditPage
