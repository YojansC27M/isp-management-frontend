import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useUI } from "@/ui/uiContext"
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
  const actor = useAuthStore((state) => state.user)

  const handleSubmit = async (values: InternalUserFormValues) => {
    try {
      const created = await createInternalUser(values)
      const entry: SecurityAuditEntry = {
        id: createAuditId(),
        createdAt: new Date().toISOString(),
        actorName: actor?.name ?? "Usuario local",
        actorRole: actor?.role ?? "admin",
        targetRole: "all",
        action: "internal_user_create",
        details: `Se creo el usuario interno ${created.name} (${created.role}).`,
      }
      const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
      writeSecurityAudit(nextAudit)

      notify({
        title: "Usuario interno creado",
        description: "La informacion del perfil fue guardada correctamente.",
        type: "success",
      })
      navigate("/internal-users")
    } catch (err) {
      notify({
        title: "No se pudo crear el usuario interno",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Crear usuario interno</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra personal interno y perfil tecnico cuando aplique.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/internal-users")}>
          Volver a Usuarios internos
        </Button>
      </header>

      <InternalUserForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear usuario" />
    </div>
  )
}

export default InternalUserCreatePage
