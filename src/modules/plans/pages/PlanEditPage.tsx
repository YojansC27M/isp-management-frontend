import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
import PlanForm from "../components/PlanForm"
import { getPlanById, updatePlan } from "../services/plansApi"
import type { PlanFormValues } from "../types/plan"

const PlanEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const [initialValues, setInitialValues] = useState<PlanFormValues | null>(null)
  const [currency, setCurrency] = useState("COP")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  useEffect(() => {
    const loadPlan = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const plan = await getPlanById(id)
        const { name, downloadSpeed, uploadSpeed, price, type } = plan
        setInitialValues({ name, downloadSpeed, uploadSpeed, price, type })
      } catch (err) {
        setError(getErrorMessage(err, t("plans.loadErrorTitle")))
      } finally {
        setLoading(false)
      }
    }

    void loadPlan()
  }, [id, t])

  const handleSubmit = async (values: PlanFormValues) => {
    if (!id) return
    try {
      await updatePlan(id, values)
      notify({ title: t("plans.updateSuccess"), type: "success" })
      navigate("/plans")
    } catch (err) {
      notify({
        title: t("plans.saveErrorTitle"),
        description: getErrorMessage(err, t("plans.saveErrorDesc")),
        type: "error",
      })
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("plans.editLoading")}</p>
  if (error) return <p className="text-sm text-muted-foreground">{error}</p>
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
      <PlanForm initialValues={initialValues} currency={currency} onSubmit={handleSubmit} submitLabel={t("profile.save")} />
    </div>
  )
}

export default PlanEditPage
