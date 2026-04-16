import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import PlansTable from "../components/PlansTable"
import { deletePlan, getPlans } from "../services/plansApi"
import type { Plan } from "../types/plan"

const PlansListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { confirm, notify } = useUI()
  const [search, setSearch] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManagePlans = useCan("plans.write")

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getPlans()
      setPlans(data)
    } catch (err) {
      setError(getErrorMessage(err, t("plans.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase()
    return plans.filter((plan) => plan.name.toLowerCase().includes(term))
  }, [plans, search])

  const handleDelete = async (id: string) => {
    if (!canManagePlans) return
    const accepted = await confirm({
      title: t("plans.deleteTitle"),
      description: t("plans.deleteDescription"),
      confirmLabel: t("plans.deleteConfirm"),
    })
    if (!accepted) return
    try {
      await deletePlan(id)
      await loadPlans()
      notify({ title: t("plans.deleted"), type: "success" })
    } catch (err) {
      notify({
        title: t("plans.deleteErrorTitle"),
        description: getErrorMessage(err, t("plans.deleteErrorDesc")),
        type: "error",
      })
    }
  }

  const searchInputId = "plans-list-search"

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("plans.title")}
        description={t("plans.description")}
        actions={
          <Button
            onClick={() => navigate("/plans/new")}
            disabled={!canManagePlans}
            title={!canManagePlans ? t("plans.permissionCreate") : undefined}
          >
            {t("plans.create")}
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-1.5 md:max-w-sm">
          <Label htmlFor={searchInputId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("plans.search")}
          </Label>
          <Input
            id={searchInputId}
            type="search"
            placeholder={t("plans.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("plans.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("plans.loadErrorTitle")} description={error} />
      ) : filteredPlans.length === 0 ? (
        <StateMessage variant="empty" title={t("plans.emptyTitle")} />
      ) : (
        <PlansTable
          plans={filteredPlans}
          onEdit={(id) => navigate(`/plans/${id}/edit`)}
          onDelete={handleDelete}
          canManage={canManagePlans}
        />
      )}
    </div>
  )
}

export default PlansListPage
