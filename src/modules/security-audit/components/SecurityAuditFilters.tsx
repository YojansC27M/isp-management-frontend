import { Filter, Search } from "lucide-react"
import { appRoles, roleLabels } from "@/auth/permissions"
import FilterPanel from "@/components/shared/FilterPanel"
import { useI18n } from "@/i18n/i18nContext"
import type { SecurityAuditAction, SecurityAuditFilters as SecurityAuditFiltersType } from "../types/securityAudit"
import { getSecurityAuditActionOptions } from "../services/securityAuditService"

interface SecurityAuditFiltersProps {
  filters: SecurityAuditFiltersType
  onChange: (next: SecurityAuditFiltersType) => void
}

const SecurityAuditFilters = ({ filters, onChange }: SecurityAuditFiltersProps) => {
  const { t } = useI18n()
  const actionOptions = getSecurityAuditActionOptions()

  return (
    <FilterPanel>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Filter className="h-4 w-4" />
        {t("securityAudit.filters")}
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">{t("securityAudit.search")}</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder={t("securityAudit.searchPlaceholder")}
              className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-2 text-sm text-muted-foreground outline-none focus:border-ring"
            />
          </div>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">{t("securityAudit.action")}</span>
          <select
            value={filters.selectedAction}
            onChange={(event) => onChange({ ...filters, selectedAction: event.target.value as SecurityAuditAction | "all" })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">{t("securityAudit.allFemale")}</option>
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">{t("securityAudit.actorRole")}</span>
          <select
            value={filters.selectedActorRole}
            onChange={(event) => onChange({ ...filters, selectedActorRole: event.target.value as SecurityAuditFiltersType["selectedActorRole"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">{t("securityAudit.all")}</option>
            {appRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">{t("securityAudit.targetRole")}</span>
          <select
            value={filters.selectedTargetRole}
            onChange={(event) => onChange({ ...filters, selectedTargetRole: event.target.value as SecurityAuditFiltersType["selectedTargetRole"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">{t("securityAudit.all")}</option>
            <option value="system">{t("securityAudit.system")}</option>
            {appRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">{t("securityAudit.period")}</span>
          <select
            value={filters.dateFilter}
            onChange={(event) => onChange({ ...filters, dateFilter: event.target.value as SecurityAuditFiltersType["dateFilter"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">{t("securityAudit.period.all")}</option>
            <option value="today">{t("securityAudit.period.today")}</option>
            <option value="last7">{t("securityAudit.period.last7")}</option>
          </select>
        </label>
      </div>
    </FilterPanel>
  )
}

export default SecurityAuditFilters
