import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
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
  const { t } = useI18n()
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
          const message = t("visits.create.conflictMessage", { clientName: conflict.clientName })
          setConflictMessage(message)
          notify({
            title: t("visits.create.conflictTitle"),
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
          actorName: actor?.name ?? t("internalUsers.localUser"),
          actorRole: actor?.role ?? "admin",
          targetRole: "all",
          action: "technician_assignment",
          details: t("visits.create.auditAssigned", { technicianName: created.technicianName, id: created.id }),
        }
        const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
        writeSecurityAudit(nextAudit)
      }
      notify({
        title: created.technicianId ? t("visits.create.successAssigned") : t("visits.create.successUnassigned"),
        description: created.technicianId
          ? t("visits.create.successAssignedDesc")
          : t("visits.create.successUnassignedDesc"),
        type: "success",
      })
      navigate("/visits")
    } catch (err) {
      notify({
        title: t("visits.create.errorTitle"),
        description: getErrorMessage(err, t("visits.create.errorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("visits.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("visits.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/visits")}>
          {t("visits.create.back")}
        </Button>
      </header>
      {conflictMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{conflictMessage}</div>
      )}
      <VisitForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("visits.create")} />
    </div>
  )
}

export default VisitCreatePage
