import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import TicketForm from "../components/TicketForm"
import { createTicket } from "../services/ticketsApi"
import type { TicketFormValues } from "../types/ticket"

const initialValues: TicketFormValues = {
  clientId: "",
  assignedTechnicianId: "",
  assignedTechnicianName: "",
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
    navigate("/tickets")
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Crear ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra incidencias con prioridad y categoría.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          Volver a Tickets
        </Button>
      </header>
      <TicketForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear ticket" />
    </div>
  )
}

export default TicketCreatePage
