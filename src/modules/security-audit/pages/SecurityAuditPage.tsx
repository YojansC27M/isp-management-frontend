import { useMemo, useState } from "react"
import type { SecurityAuditFilters } from "../types/securityAudit"
import SecurityAuditEvents from "../components/SecurityAuditEvents"
import SecurityAuditFiltersPanel from "../components/SecurityAuditFilters"
import SecurityAuditHero from "../components/SecurityAuditHero"
import SecurityAuditStats from "../components/SecurityAuditStats"
import {
  buildSecurityAuditStats,
  exportSecurityAuditAsJson,
  filterSecurityAuditEntries,
  loadSecurityAudit,
} from "../services/securityAuditService"

const initialFilters: SecurityAuditFilters = {
  search: "",
  selectedAction: "all",
  selectedActorRole: "all",
  selectedTargetRole: "all",
  dateFilter: "all",
}

const SecurityAuditPage = () => {
  const [filters, setFilters] = useState<SecurityAuditFilters>(initialFilters)
  const [entries, setEntries] = useState(() => loadSecurityAudit())

  const filteredEntries = useMemo(() => filterSecurityAuditEntries(entries, filters), [entries, filters])
  const stats = useMemo(() => buildSecurityAuditStats(entries), [entries])

  return (
    <div className="space-y-6">
      <SecurityAuditHero
        onRefresh={() => setEntries(loadSecurityAudit())}
        onExport={() => exportSecurityAuditAsJson(filteredEntries)}
        disableExport={filteredEntries.length === 0}
      />

      <SecurityAuditStats stats={stats} />

      <SecurityAuditFiltersPanel filters={filters} onChange={setFilters} />

      <SecurityAuditEvents entries={filteredEntries} />
    </div>
  )
}

export default SecurityAuditPage
