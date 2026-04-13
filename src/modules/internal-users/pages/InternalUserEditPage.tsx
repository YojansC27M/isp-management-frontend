import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useUI } from "@/ui/uiContext"
import type { SecurityAuditEntry } from "@/auth/auditLog"
import { readSecurityAudit, writeSecurityAudit } from "@/auth/auditLog"
import { useAuthStore } from "@/store/authStore"
import { getErrorMessage } from "@/lib/errors"
import InternalUserForm from "../components/InternalUserForm"
import { getInternalUserById, updateInternalUser } from "../services/internalUsersApi"
import type { InternalUserFormValues } from "../types/internalUser"

const createAuditId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

const InternalUserEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useUI()
  const actor = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [initialValues, setInitialValues] = useState<InternalUserFormValues | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const user = await getInternalUserById(id)
        setInitialValues({
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          technicianProfile: user.technicianProfile,
        })
      } catch (err) {
        setError(getErrorMessage(err, "No fue posible cargar el usuario interno."))
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [id])

  const handleSubmit = async (values: InternalUserFormValues) => {
    if (!id) return
    try {
      const updated = await updateInternalUser(id, values)
      const entry: SecurityAuditEntry = {
        id: createAuditId(),
        createdAt: new Date().toISOString(),
        actorName: actor?.name ?? "Usuario local",
        actorRole: actor?.role ?? "admin",
        targetRole: "all",
        action: "internal_user_update",
        details: `Se actualizo el usuario interno ${updated.name} (${updated.role}).`,
      }
      const nextAudit = [entry, ...readSecurityAudit()].slice(0, 50)
      writeSecurityAudit(nextAudit)

      notify({
        title: "Usuario interno actualizado",
        description: "Los cambios fueron guardados correctamente.",
        type: "success",
      })
      navigate("/internal-users")
    } catch (err) {
      notify({
        title: "No se pudo actualizar el usuario interno",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  if (loading) return <StateMessage variant="loading" title="Cargando usuario interno..." />
  if (error) return <StateMessage variant="error" title="Error al cargar usuario interno" description={error} />
  if (!initialValues) return <StateMessage variant="empty" title="Usuario interno no encontrado." />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Editar usuario interno</h1>
          <p className="mt-1 text-sm text-muted-foreground">Actualiza rol, estado y perfil tecnico del usuario.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/internal-users")}>
          Volver a Usuarios internos
        </Button>
      </header>

      <InternalUserForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
    </div>
  )
}

export default InternalUserEditPage
