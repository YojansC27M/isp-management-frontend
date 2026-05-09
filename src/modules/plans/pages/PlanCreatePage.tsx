import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
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
  const { notify } = useUI()
  const [currency, setCurrency] = useState("COP")

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settings = await getSystemSettings()
        if (settings.currency?.trim()) setCurrency(settings.currency)
      } catch {
        // fallback to COP
      }
    }
    void loadCurrency()
  }, [])

  const handleSubmit = async (values: PlanFormValues) => {
    try {
      await createPlan(values)
      notify({ title: t("plans.createSuccess"), type: "success" })
      navigate("/plans")
    } catch (err) {
      notify({
        title: t("plans.saveErrorTitle"),
        description: getErrorMessage(err, t("plans.saveErrorDesc")),
        type: "error",
      })
    }
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
      <PlanForm initialValues={initialValues} currency={currency} onSubmit={handleSubmit} submitLabel={t("plans.create")} />
    </div>
  )
}

export default PlanCreatePage
