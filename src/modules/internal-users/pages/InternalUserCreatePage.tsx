import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { useAuthStore } from "@/store/authStore"
import { getErrorMessage } from "@/lib/errors"
import InternalUserForm from "../components/InternalUserForm"
import { createInternalUser } from "../services/internalUsersApi"
import type { InternalUserFormValues } from "../types/internalUser"

const initialValues: InternalUserFormValues = {
  name: "",
  email: "",
  phone: "",
  role: "staff",
  status: "active",
  technicianProfile: null,
}

const createAuditId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const InternalUserCreatePage = () => {
  const navigate = useNavigate()
  const { notify } = useUI()
  const { t } = useI18n()
  const actor = useAuthStore((state) => state.user)

  const handleSubmit = async (values: InternalUserFormValues) => {
    try {
      const created = await createInternalUser(values)
      const entry: SecurityAuditEntry = {
        id: createAuditId(),
        createdAt: new Date().toISOString(),
        actorName: actor?.name ?? t("internalUsers.localUser"),
        actorRole: actor?.role ?? "admin",
        targetRole: "all",
        action: "internal_user_create",
        details: t("internalUsers.create.auditDetails", { name: created.name, role: created.role }),
      }
      const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
      writeSecurityAudit(nextAudit)

      notify({
        title: t("internalUsers.create.successTitle"),
        description: t("internalUsers.create.successDesc"),
        type: "success",
      })
      navigate("/internal-users")
    } catch (err) {
      notify({
        title: t("internalUsers.create.errorTitle"),
        description: getErrorMessage(err, t("internalUsers.create.errorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("internalUsers.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("internalUsers.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/internal-users")}>
          {t("internalUsers.backToList")}
        </Button>
      </header>

      <InternalUserForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("internalUsers.create.submit")} />
    </div>
  )
}

export default InternalUserCreatePage
