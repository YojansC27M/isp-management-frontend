import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Crear cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">Agrega un nuevo cliente a tu operación.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          Volver a Clientes
        </Button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear cliente" />
    </div>
  )
}

export default ClientCreatePage
