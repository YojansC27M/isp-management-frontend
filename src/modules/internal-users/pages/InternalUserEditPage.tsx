import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorDescription, getErrorMessage } from "@/lib/errors"
import InternalUserForm from "../components/InternalUserForm"
import { getInternalUserById, updateInternalUser } from "../services/internalUsersApi"
import type { InternalUserFormValues } from "../types/internalUser"

const InternalUserEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useUI()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          phone: user.phone,
          role: user.role,
          status: user.status,
          technicianProfile: user.technicianProfile,
        })
      } catch (err) {
        setError(getErrorMessage(err, t("internalUsers.edit.loadErrorDefault")))
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [id, t])

  const handleSubmit = async (values: InternalUserFormValues) => {
    if (!id) return
    if (submitting) return
    setSubmitting(true)
    try {
      await updateInternalUser(id, values)

      notify({
        title: t("internalUsers.edit.successTitle"),
        description: t("internalUsers.edit.successDesc"),
        type: "success",
      })
      navigate("/internal-users")
    } catch (err) {
      notify({
        title: t("internalUsers.edit.errorTitle"),
        description: getErrorDescription(err, t("internalUsers.edit.errorDesc")),
        type: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title={t("internalUsers.edit.loading")} />
  if (error) return <StateMessage variant="error" title={t("internalUsers.edit.loadErrorTitle")} description={error} />
  if (!initialValues) return <StateMessage variant="empty" title={t("internalUsers.edit.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("internalUsers.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("internalUsers.editDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/internal-users")}>
          {t("internalUsers.backToList")}
        </Button>
      </header>

      <InternalUserForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("profile.save")} isSubmitting={submitting} />
    </div>
  )
}

export default InternalUserEditPage
