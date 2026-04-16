import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import PlanForm from "../components/PlanForm"
import { createPlan } from "../services/plansApi"
import type { PlanFormValues } from "../types/plan"

const initialValues: PlanFormValues = {
  name: "",
  downloadSpeed: 0,
  uploadSpeed: 0,
  price: 0,
  type: "residential",
}

const PlanCreatePage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()

  const handleSubmit = async (values: PlanFormValues) => {
    await createPlan(values)
    navigate("/plans")
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("plans.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("plans.createDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/plans")}>
          {t("plans.backToList")}
        </Button>
      </header>
      <PlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("plans.create")} />
    </div>
  )
}

export default PlanCreatePage
