import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorDescription } from "@/lib/errors"
import InternalUserForm from "../components/InternalUserForm"
import { createInternalUser } from "../services/internalUsersApi"
import type { InternalUserFormValues } from "../types/internalUser"

const initialValues: InternalUserFormValues = {
  name: "",
  email: "",
  documentType: "CC",
  documentNumber: "",
  phone: "",
  role: "staff",
  status: "active",
  technicianProfile: null,
}

const InternalUserCreatePage = () => {
  const navigate = useNavigate()
  const { notify } = useUI()
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (values: InternalUserFormValues) => {
    if (submitting) return
    setSubmitting(true)
    try {
      await createInternalUser(values)

      notify({
        title: t("internalUsers.create.successTitle"),
        description: t("internalUsers.create.successDesc"),
        type: "success",
      })
      navigate("/internal-users")
    } catch (err) {
      notify({
        title: t("internalUsers.create.errorTitle"),
        description: getErrorDescription(err, t("internalUsers.create.errorDesc")),
        type: "error",
      })
    } finally {
      setSubmitting(false)
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

      <InternalUserForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel={t("internalUsers.create.submit")}
        isSubmitting={submitting}
      />
    </div>
  )
}

export default InternalUserCreatePage
