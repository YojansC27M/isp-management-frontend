import { useNavigate } from "react-router-dom"
import TicketForm from "../components/TicketForm"
import { createTicket } from "../services/ticketsApi"
import type { TicketFormValues } from "../types/ticket"

const initialValues: TicketFormValues = {
  clientId: "",
  title: "",
  description: "",
  category: "technical",
  priority: "medium",
  status: "open",
}

const TicketCreatePage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (values: TicketFormValues) => {
    await createTicket(values)
    window.alert("Ticket creado correctamente.")
    navigate("/tickets")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Crear ticket</h1>
        <p style={{ color: "#6b7280" }}>Registra un nuevo ticket de soporte.</p>
        <button type="button" onClick={() => navigate("/tickets")} style={{ width: "fit-content" }}>
          Volver a Tickets
        </button>
      </header>
      <TicketForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear" />
    </div>
  )
}

export default TicketCreatePage
