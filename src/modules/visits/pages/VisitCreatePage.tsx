import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import VisitForm from "../components/VisitForm"
import { createVisit, findTechnicianConflict } from "../services/visitsApi"
import type { VisitFormValues } from "../types/visit"

const initialValues: VisitFormValues = {
  clientId: "",
  technicianId: "",
  zone: "",
  type: "installation",
  scheduledDate: "",
  scheduledTime: "",
  status: "scheduled",
  notes: "",
}

const VisitCreatePage = () => {
  const navigate = useNavigate()
  const { notify } = useUI()
  const actor = useAuthStore((state) => state.user)
  const [conflictMessage, setConflictMessage] = useState("")

  const handleSubmit = async (values: VisitFormValues) => {
    setConflictMessage("")
    try {
      if (values.technicianId) {
        const conflict = await findTechnicianConflict({
          technicianId: values.technicianId,
          scheduledDate: values.scheduledDate,
          scheduledTime: values.scheduledTime,
        })

        if (conflict) {
          const message = `El tecnico ya tiene una visita en ese horario (${conflict.clientName}).`
          setConflictMessage(message)
          notify({
            title: "Conflicto de disponibilidad",
            description: message,
            type: "error",
          })
          return
        }
      }

      const created = await createVisit(values)
      if (created.technicianId) {
        const entry: SecurityAuditEntry = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
          actorName: actor?.name ?? "Usuario local",
          actorRole: actor?.role ?? "admin",
          targetRole: "all",
          action: "technician_assignment",
          details: `Se asigno ${created.technicianName} a la visita ${created.id}.`,
        }
        const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
        writeSecurityAudit(nextAudit)
      }
      notify({
        title: created.technicianId ? "Visita programada" : "Visita creada sin asignacion",
        description: created.technicianId
          ? "La agenda se actualizo correctamente."
          : "No habia tecnico disponible para el contexto. Puedes asignarlo mas adelante.",
        type: "success",
      })
      navigate("/visits")
    } catch (err) {
      notify({
        title: "No fue posible programar la visita",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Programar visita</h1>
          <p className="mt-1 text-sm text-muted-foreground">Asigna tecnico, horario y valida disponibilidad en agenda.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/visits")}>
          Volver a Visitas
        </Button>
      </header>
      {conflictMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{conflictMessage}</div>
      )}
      <VisitForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Programar visita" />
    </div>
  )
}

export default VisitCreatePage
