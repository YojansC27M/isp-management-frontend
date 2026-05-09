import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { normalizeApiError } from "@/api/apiError"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { getPlans } from "@/modules/plans/services/plansApi"
import type { Plan } from "@/modules/plans/types/plan"
import ClientForm from "../components/ClientForm"
import { getClientById, updateClient } from "../services/clientsApi"
import type { ClientFormValues } from "../types/client"

const ClientEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [initialValues, setInitialValues] = useState<ClientFormValues | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return
      setLoading(true)
      setLoadError(false)
      try {
        const [client, plansData] = await Promise.all([getClientById(id), getPlans({ cancel: false })])
        const { name, document, address, phone, email, planId, ipAddress, status, latitude, longitude } = client
        setPlans(plansData)
        setInitialValues({
          name,
          document,
          address,
          phone,
          email,
          planId: planId ?? "",
          ipAddress,
          status,
          latitude,
          longitude,
        })
      } catch (error) {
        if (normalizeApiError(error).code !== "canceled") setLoadError(true)
      } finally {
        setLoading(false)
      }
    }

    void loadClient()
  }, [id])

  const handleSubmit = async (values: ClientFormValues) => {
    if (!id) return
    await updateClient(id, values)
    navigate("/clients")
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("clients.editLoading")}</p>
  if (loadError) return <p className="text-sm text-muted-foreground">{t("clients.detail.loadErrorDefault")}</p>
  if (!initialValues) return <p className="text-sm text-muted-foreground">{t("clients.editNotFound")}</p>

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("clients.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clients.editDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          {t("clients.backToList")}
        </Button>
      </header>
      <ClientForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        planOptions={plans.map((plan) => ({ id: plan.id, name: plan.name }))}
        submitLabel={t("profile.save")}
      />
    </div>
  )
}

export default ClientEditPage
