import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
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
  const { t } = useI18n()
  const actor = useAuthStore((state) => state.user)
  const { notify } = useUI()

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      const created = await createTicket(values)
      if (created.assignedTechnicianId || created.assignedUserId) {
        const assigneeName = created.assignedTechnicianId ? created.assignedTechnicianName : created.assignedUserName
        const entry: SecurityAuditEntry = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date().toISOString(),
          actorName: actor?.name ?? t("internalUsers.localUser"),
          actorRole: actor?.role ?? "admin",
          targetRole: "all",
          action: "technician_assignment",
          details: t("tickets.create.auditDetails", { name: assigneeName, id: created.id }),
        }
        const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
        writeSecurityAudit(nextAudit)
      }
      notify({
        title: created.assignedTechnicianId ? t("tickets.create.success") : t("tickets.create.successUnassigned"),
        description: created.assignedTechnicianId ? t("tickets.create.successDesc") : t("tickets.create.successUnassignedDesc"),
        type: "success",
      })
      navigate("/tickets")
    } catch (err) {
      notify({
        title: t("tickets.create.errorTitle"),
        description: getErrorMessage(err, t("tickets.create.errorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("tickets.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tickets.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          {t("tickets.create.back")}
        </Button>
      </header>
      <TicketForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("tickets.create")} />
    </div>
  )
}

export default TicketCreatePage
