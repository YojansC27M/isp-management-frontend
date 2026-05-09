import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
import type { Plan, PlanSortBy, PlanSortDir } from "../types/plan"

interface PlansTableProps {
  plans: Plan[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  canManage: boolean
  formatPrice: (value: number) => string
  sortBy: PlanSortBy
  sortDir: PlanSortDir
  onSort: (field: PlanSortBy) => void
}

const PlansTable = ({ plans, onEdit, onDelete, canManage, formatPrice, sortBy, sortDir, onSort }: PlansTableProps) => {
  const { t } = useI18n()

  const SortIcon = sortDir === "asc" ? ArrowUp : ArrowDown
  const renderSortIcon = (field: PlanSortBy) =>
    sortBy === field ? <SortIcon className="h-3.5 w-3.5 text-primary" /> : null

  return (
    <DataTableShell>
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead className="bg-muted/35 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">
              <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort("name")}>
                {t("plans.table.name")}
                {renderSortIcon("name")}
              </button>
            </th>
            <th className="px-4 py-3 text-right font-semibold">
              <button type="button" className="ml-auto inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort("downloadSpeed")}>
                {t("plans.table.download")}
                {renderSortIcon("downloadSpeed")}
              </button>
            </th>
            <th className="px-4 py-3 text-right font-semibold">
              <button type="button" className="ml-auto inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort("uploadSpeed")}>
                {t("plans.table.upload")}
                {renderSortIcon("uploadSpeed")}
              </button>
            </th>
            <th className="px-4 py-3 text-right font-semibold">
              <button type="button" className="ml-auto inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort("price")}>
                {t("plans.table.price")}
                {renderSortIcon("price")}
              </button>
            </th>
            <th className="px-4 py-3 font-semibold">{t("plans.table.type")}</th>
            <th className="px-4 py-3 font-semibold">{t("plans.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} className="border-t border-border/60">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.downloadSpeed} / {plan.uploadSpeed} Mbps
                </p>
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{plan.downloadSpeed} Mbps</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{plan.uploadSpeed} Mbps</td>
              <td className="px-4 py-3 text-right">
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {formatPrice(plan.price)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {t(`plans.form.type.${plan.type}`)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(plan.id)}
                    disabled={!canManage}
                    title={!canManage ? t("plans.permissionEdit") : undefined}
                  >
                    {t("plans.table.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => onDelete(plan.id)}
                    disabled={!canManage}
                    title={!canManage ? t("plans.permissionDelete") : undefined}
                  >
                    {t("plans.table.delete")}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  )
}

export default PlansTable
