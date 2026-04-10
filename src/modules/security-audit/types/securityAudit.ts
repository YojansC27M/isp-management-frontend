import type { SecurityAuditAction, SecurityAuditEntry } from "@/auth/auditLog"
import type { Role } from "@/auth/types"

export type SecurityAuditDateFilter = "all" | "today" | "last7"
export type SecurityAuditTargetFilter = "all" | Role | "system"

export interface SecurityAuditFilters {
  search: string
  selectedAction: SecurityAuditAction | "all"
  selectedActorRole: Role | "all"
  selectedTargetRole: SecurityAuditTargetFilter
  dateFilter: SecurityAuditDateFilter
}

export interface SecurityAuditStats {
  total: number
  todayCount: number
  last7Count: number
  riskyChanges: number
}

export interface SecurityAuditActionMeta {
  actionLabels: Record<SecurityAuditAction, string>
  actionBadgeClass: Record<SecurityAuditAction, string>
}

export type { SecurityAuditAction, SecurityAuditEntry }

