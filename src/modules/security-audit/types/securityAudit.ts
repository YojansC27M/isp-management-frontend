import type { SecurityAuditAction as LegacySecurityAuditAction } from "@/auth/auditLog"
import type { Role } from "@/auth/types"

export interface SecurityAuditActor {
  id: string
  name: string
  email: string
  roleKey?: string
  roleName?: string
}

export interface SecurityAuditEntry {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId: string | null
  actor: SecurityAuditActor | null
  metadata: Record<string, unknown> | null
}

export interface SecurityAuditFilters {
  search: string
  actorId?: string
  action?: string
  module?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  perPage?: number
  selectedAction?: SecurityAuditAction | "all"
  selectedActorRole?: Role | "all"
  selectedTargetRole?: SecurityAuditTargetFilter
  dateFilter?: SecurityAuditDateFilter
}

export interface SecurityAuditStats {
  total: number
  todayCount: number
  last7Count: number
  sensitiveCount: number
}

export type SecurityAuditAction = LegacySecurityAuditAction
export type SecurityAuditDateFilter = "all" | "today" | "last7"
export type SecurityAuditTargetFilter = "all" | Role | "system"
