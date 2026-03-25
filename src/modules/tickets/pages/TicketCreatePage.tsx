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
    window.alert("Ticket created successfully.")
    navigate("/tickets")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Create Ticket</h1>
        <p style={{ color: "#6b7280" }}>Log a new support ticket.</p>
        <button type="button" onClick={() => navigate("/tickets")} style={{ width: "fit-content" }}>
          Back to Tickets
        </button>
      </header>
      <TicketForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  )
}

export default TicketCreatePage
