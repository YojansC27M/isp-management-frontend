import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import KpiCard from "@/components/shared/KpiCard"
import PageHeader from "@/components/shared/PageHeader"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import { formatCurrency } from "@/lib/currency"
import { normalizePlansQuery } from "../lib/query"
import PlansTable from "../components/PlansTable"
import { deletePlan, getPlansPage } from "../services/plansApi"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
import type { Plan, PlanSortBy, PlanSortDir, PlanType, PlansPageMeta } from "../types/plan"

const initialSearch = ""
const initialType = ""
const initialSortBy: PlanSortBy = "createdAt"
const initialSortDir: PlanSortDir = "desc"

const defaultMeta: PlansPageMeta = {
  page: 1,
  perPage: 25,
  total: 0,
  totalPages: 1,
}

const PlansListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { confirm, notify } = useUI()
  const canManagePlans = useCan("plans.write")

  const [searchInput, setSearchInput] = useState(initialSearch)
  const [typeInput, setTypeInput] = useState<PlanType | "">(initialType)
  const [appliedSearch, setAppliedSearch] = useState(initialSearch)
  const [appliedType, setAppliedType] = useState<PlanType | "">(initialType)
  const [sortBy, setSortBy] = useState<PlanSortBy>(initialSortBy)
  const [sortDir, setSortDir] = useState<PlanSortDir>(initialSortDir)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [currency, setCurrency] = useState("COP")
  const [plans, setPlans] = useState<Plan[]>([])
  const [meta, setMeta] = useState<PlansPageMeta>(defaultMeta)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settings = await getSystemSettings()
        if (settings.currency?.trim()) setCurrency(settings.currency)
      } catch {
        // keep default COP if settings request fails
      }
    }
    void loadCurrency()
  }, [])

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const query = normalizePlansQuery({
        search: appliedSearch,
        type: appliedType,
        sortBy,
        sortDir,
        page,
        perPage,
      })
      const data = await getPlansPage(query)
      setPlans(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(getErrorMessage(err, t("plans.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, appliedType, page, perPage, sortBy, sortDir, t])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const summary = useMemo(() => {
    if (plans.length === 0) {
      return { total: meta.total, avgPrice: 0, topDownload: 0, businessCount: 0 }
    }

    const avgPrice = plans.reduce((acc, plan) => acc + plan.price, 0) / plans.length
    const topDownload = plans.reduce((acc, plan) => Math.max(acc, plan.downloadSpeed), 0)
    const businessCount = plans.filter((plan) => plan.type === "business").length
    return { total: meta.total, avgPrice, topDownload, businessCount }
  }, [meta.total, plans])

  const formatPrice = useCallback((value: number) => formatCurrency(value, currency), [currency])

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

  const handleSort = (field: PlanSortBy) => {
    if (sortBy === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
      return
    }
    setSortBy(field)
    setSortDir(field === "name" ? "asc" : "desc")
  }

  const handleSearch = () => {
    setAppliedSearch(searchInput)
    setAppliedType(typeInput)
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchInput(initialSearch)
    setTypeInput(initialType)
    setAppliedSearch(initialSearch)
    setAppliedType(initialType)
    setSortBy(initialSortBy)
    setSortDir(initialSortDir)
    setPage(1)
    setPerPage(25)
  }

  const searchInputId = "plans-list-search"
  const typeInputId = "plans-list-type"

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("plans.title")}
        description={t("plans.description")}
        actions={
          <>
            <Button variant="outline" onClick={() => void loadPlans()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("plans.refresh")}
            </Button>
            <Button
              onClick={() => navigate("/plans/new")}
              disabled={!canManagePlans}
              title={!canManagePlans ? t("plans.permissionCreate") : undefined}
            >
              {t("plans.create")}
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("plans.summary.total")} value={String(summary.total)} />
        <KpiCard label={t("plans.summary.avgPrice")} value={formatPrice(summary.avgPrice)} />
        <KpiCard label={t("plans.summary.topDownload")} value={`${summary.topDownload} Mbps`} />
        <KpiCard label={t("plans.summary.business")} value={String(summary.businessCount)} />
      </section>

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto_auto] md:items-end">
          <label className="grid gap-1.5">
            <Label htmlFor={searchInputId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("plans.search")}
            </Label>
            <Input
              id={searchInputId}
              type="search"
              placeholder={t("plans.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label className="grid gap-1.5">
            <Label htmlFor={typeInputId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("plans.form.type")}
            </Label>
            <select
              id={typeInputId}
              value={typeInput}
              onChange={(event) => setTypeInput(event.target.value as PlanType | "")}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"
            >
              <option value="">{t("plans.filters.allTypes")}</option>
              <option value="residential">{t("plans.form.type.residential")}</option>
              <option value="business">{t("plans.form.type.business")}</option>
            </select>
          </label>

          <Button className="h-9" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {t("plans.searchButton")}
          </Button>

          <Button className="h-9" variant="outline" onClick={handleClearFilters} disabled={loading}>
            {t("plans.filters.clear")}
          </Button>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("plans.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("plans.loadErrorTitle")} description={error} />
      ) : plans.length === 0 ? (
        <StateMessage variant="empty" title={t("plans.emptyTitle")} />
      ) : (
        <div className="grid gap-3">
          <PlansTable
            plans={plans}
            onEdit={(id) => navigate(`/plans/${id}/edit`)}
            onDelete={handleDelete}
            canManage={canManagePlans}
            formatPrice={formatPrice}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {t("plans.pagination.summary", {
                page: meta.page,
                totalPages: meta.totalPages,
                total: meta.total,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-muted-foreground">
                <span>{t("plans.pagination.perPage")}</span>
                <select
                  className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                  value={perPage}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    setPerPage(Number.isFinite(next) ? next : 25)
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={meta.page <= 1}>
                {t("plans.pagination.prev")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                disabled={meta.page >= meta.totalPages}
              >
                {t("plans.pagination.next")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlansListPage
