import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import PlanForm from "../components/PlanForm"
import { getPlanById, updatePlan } from "../services/plansApi"
import type { PlanFormValues } from "../types/plan"

const PlanEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [initialValues, setInitialValues] = useState<PlanFormValues | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlan = async () => {
      if (!id) return
      setLoading(true)
      try {
        const plan = await getPlanById(id)
        const { name, downloadSpeed, uploadSpeed, price, type } = plan
        setInitialValues({ name, downloadSpeed, uploadSpeed, price, type })
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [id])

  const handleSubmit = async (values: PlanFormValues) => {
    if (!id) return
    await updatePlan(id, values)
    navigate("/plans")
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("plans.editLoading")}</p>
  if (!initialValues) return <p className="text-sm text-muted-foreground">{t("plans.editNotFound")}</p>

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("plans.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("plans.editDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/plans")}>
          {t("plans.backToList")}
        </Button>
      </header>
      <PlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("profile.save")} />
    </div>
  )
}

export default PlanEditPage
