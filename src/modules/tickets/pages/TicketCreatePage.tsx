import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import TicketForm from "../components/TicketForm"
import { createTicket } from "../services/ticketsApi"
import type { TicketFormValues } from "../types/ticket"

const initialValues: TicketFormValues = {
  clientId: "",
  assignedUserId: "",
  assignedUserName: "",
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
  const actor = useAuthStore((state) => state.user)
  const { notify } = useUI()

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      const created = await createTicket(values)
      if (created.assignedTechnicianId || created.assignedUserId) {
        const assigneeName = created.assignedTechnicianId
          ? created.assignedTechnicianName
          : created.assignedUserName
        const entry: SecurityAuditEntry = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
          actorName: actor?.name ?? "Usuario local",
          actorRole: actor?.role ?? "admin",
          targetRole: "all",
          action: "technician_assignment",
          details: `Se asigno ${assigneeName} al ticket ${created.id}.`,
        }
        const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
        writeSecurityAudit(nextAudit)
      }
      notify({
        title: created.assignedTechnicianId ? "Ticket creado" : "Ticket creado sin asignacion",
        description: created.assignedTechnicianId
          ? "La incidencia fue registrada correctamente."
          : "No habia tecnico disponible para el contexto. Puedes asignarlo mas adelante.",
        type: "success",
      })
      navigate("/tickets")
    } catch (err) {
      notify({
        title: "No fue posible crear el ticket",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
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
