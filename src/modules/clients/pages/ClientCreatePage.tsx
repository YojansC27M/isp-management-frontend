import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { getPlans } from "@/modules/plans/services/plansApi"
import ClientForm from "../components/ClientForm"
import { createClient } from "../services/clientsApi"
import type { ClientFormValues } from "../types/client"
import type { Plan } from "@/modules/plans/types/plan"

const initialValues: ClientFormValues = {
  name: "",
  document: "",
  address: "",
  phone: "",
  email: "",
  planId: "",
  ipAddress: "",
  status: "active",
  latitude: null,
  longitude: null,
}

const ClientCreatePage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      setLoadingPlans(true)
      try {
        const data = await getPlans()
        setPlans(data)
      } finally {
        setLoadingPlans(false)
      }
    }

    void loadPlans()
  }, [])

  const handleSubmit = async (values: ClientFormValues) => {
    await createClient(values)
    navigate("/clients")
  }

  if (loadingPlans) {
    return <StateMessage variant="loading" title="Cargando planes..." />
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("clients.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clients.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          {t("clients.backToList")}
        </Button>
      </header>
      <ClientForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        planOptions={plans.map((plan) => ({ id: plan.id, name: plan.name }))}
        submitLabel={t("clients.create")}
      />
    </div>
  )
}

export default ClientCreatePage
