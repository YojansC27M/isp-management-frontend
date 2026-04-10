import { Filter, Search } from "lucide-react"
import { appRoles, roleLabels } from "@/auth/permissions"
import FilterPanel from "@/components/shared/FilterPanel"
import type { SecurityAuditAction, SecurityAuditFilters as SecurityAuditFiltersType } from "../types/securityAudit"
import { getSecurityAuditActionOptions } from "../services/securityAuditService"

interface SecurityAuditFiltersProps {
  filters: SecurityAuditFiltersType
  onChange: (next: SecurityAuditFiltersType) => void
}

const SecurityAuditFilters = ({ filters, onChange }: SecurityAuditFiltersProps) => {
  const actionOptions = getSecurityAuditActionOptions()

  return (
    <FilterPanel>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Filter className="h-4 w-4" />
        Filtros
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Busqueda</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
              placeholder="Actor, detalle o accion..."
              className="h-8 w-full rounded-lg border border-border bg-card pl-8 pr-2 text-sm text-muted-foreground outline-none focus:border-ring"
            />
          </div>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Accion</span>
          <select
            value={filters.selectedAction}
            onChange={(event) => onChange({ ...filters, selectedAction: event.target.value as SecurityAuditAction | "all" })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">Todas</option>
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Rol actor</span>
          <select
            value={filters.selectedActorRole}
            onChange={(event) => onChange({ ...filters, selectedActorRole: event.target.value as SecurityAuditFiltersType["selectedActorRole"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">Todos</option>
            {appRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Perfil afectado</span>
          <select
            value={filters.selectedTargetRole}
            onChange={(event) => onChange({ ...filters, selectedTargetRole: event.target.value as SecurityAuditFiltersType["selectedTargetRole"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">Todos</option>
            <option value="system">Sistema</option>
            {appRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Periodo</span>
          <select
            value={filters.dateFilter}
            onChange={(event) => onChange({ ...filters, dateFilter: event.target.value as SecurityAuditFiltersType["dateFilter"] })}
            className="h-8 rounded-lg border border-border bg-card px-2 text-sm text-muted-foreground outline-none focus:border-ring"
          >
            <option value="all">Todo el historial</option>
            <option value="today">Solo hoy</option>
            <option value="last7">Ultimos 7 dias</option>
          </select>
        </label>
      </div>
    </FilterPanel>
  )
}

export default SecurityAuditFilters
