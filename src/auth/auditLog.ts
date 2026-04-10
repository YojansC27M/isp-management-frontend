import type { Role } from "@/auth/types"
import { appRoles } from "@/auth/permissions"

export const SECURITY_AUDIT_KEY = "auth_permissions_audit"

export type SecurityAuditAction =
  | "save"
  | "save_all"
  | "toggle_role_status"
  | "reset_role"
  | "reset_all"

export interface SecurityAuditEntry {
  id: string
  createdAt: string
  actorName: string
  actorRole: Role
  targetRole: Role | "all"
  action: SecurityAuditAction
  details: string
}

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined"
const roleSet = new Set<Role>(appRoles)
const actionSet = new Set<SecurityAuditAction>(["save", "save_all", "toggle_role_status", "reset_role", "reset_all"])

const isValidRole = (value: unknown): value is Role => typeof value === "string" && roleSet.has(value as Role)

const normalizeSecurityAuditEntry = (value: unknown): SecurityAuditEntry | null => {
  if (typeof value !== "object" || value === null) return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== "string" || !entry.id.trim()) return null
  if (typeof entry.createdAt !== "string" || !entry.createdAt.trim()) return null
  if (typeof entry.actorName !== "string" || !entry.actorName.trim()) return null
  if (!isValidRole(entry.actorRole)) return null
  if (!(entry.targetRole === "all" || isValidRole(entry.targetRole))) return null
  if (typeof entry.action !== "string" || !actionSet.has(entry.action as SecurityAuditAction)) return null
  if (typeof entry.details !== "string") return null

  return {
    id: entry.id.trim(),
    createdAt: entry.createdAt.trim(),
    actorName: entry.actorName.trim(),
    actorRole: entry.actorRole as Role,
    targetRole: entry.targetRole as Role | "all",
    action: entry.action as SecurityAuditAction,
    details: entry.details.trim(),
  }
}

export const readSecurityAudit = () => {
  if (!isBrowser()) return [] as SecurityAuditEntry[]
  try {
    const raw = localStorage.getItem(SECURITY_AUDIT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeSecurityAuditEntry).filter((entry): entry is SecurityAuditEntry => entry !== null)
  } catch {
    return []
  }
}

export const writeSecurityAudit = (entries: SecurityAuditEntry[]) => {
  if (!isBrowser()) return
  localStorage.setItem(SECURITY_AUDIT_KEY, JSON.stringify(entries.slice(0, 50)))
}
