import { readSecurityAudit, type SecurityAuditAction, type SecurityAuditEntry } from "@/auth/auditLog"
import { appRoles, roleLabels } from "@/auth/permissions"
import { getCurrentLocale } from "@/i18n/locale"
import { translateWithLocale } from "@/i18n/translations"
import type { SecurityAuditDateFilter, SecurityAuditFilters, SecurityAuditStats } from "../types/securityAudit"

const securityAuditActionLabelKeys: Record<SecurityAuditAction, string> = {
  save: "securityAudit.action.save",
  save_all: "securityAudit.action.save_all",
  toggle_role_status: "securityAudit.action.toggle_role_status",
  reset_role: "securityAudit.action.reset_role",
  reset_all: "securityAudit.action.reset_all",
  internal_user_create: "securityAudit.action.internal_user_create",
  internal_user_update: "securityAudit.action.internal_user_update",
  internal_user_delete: "securityAudit.action.internal_user_delete",
  technician_assignment: "securityAudit.action.technician_assignment",
}

export const securityAuditActionBadgeClass: Record<SecurityAuditAction, string> = {
  save: "bg-sky-100 text-sky-700",
  save_all: "bg-indigo-100 text-indigo-700",
  toggle_role_status: "bg-amber-100 text-amber-700",
  reset_role: "bg-rose-100 text-rose-700",
  reset_all: "bg-fuchsia-100 text-fuchsia-700",
  internal_user_create: "bg-emerald-100 text-emerald-700",
  internal_user_update: "bg-cyan-100 text-cyan-700",
  internal_user_delete: "bg-rose-100 text-rose-700",
  technician_assignment: "bg-violet-100 text-violet-700",
}

export const loadSecurityAudit = () => readSecurityAudit()

export const formatSecurityAuditDateTime = (isoDate: string) => {
  const locale = getCurrentLocale() === "en" ? "en-US" : "es-CO"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate))
}

export const getSecurityAuditActionLabel = (action: SecurityAuditAction) => {
  const locale = getCurrentLocale()
  return translateWithLocale(locale, securityAuditActionLabelKeys[action])
}

const isSameDay = (dateA: Date, dateB: Date) => {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

const matchesDateFilter = (entryDate: Date, filter: SecurityAuditDateFilter, now: Date) => {
  if (filter === "all") return true
  if (filter === "today") return isSameDay(entryDate, now)
  const diffMs = now.getTime() - entryDate.getTime()
  return diffMs <= 7 * 24 * 60 * 60 * 1000
}

export const filterSecurityAuditEntries = (entries: SecurityAuditEntry[], filters: SecurityAuditFilters) => {
  const term = filters.search.trim().toLowerCase()
  const now = new Date()

  return entries.filter((entry) => {
    if (filters.selectedAction !== "all" && entry.action !== filters.selectedAction) return false
    if (filters.selectedActorRole !== "all" && entry.actorRole !== filters.selectedActorRole) return false
    if (filters.selectedTargetRole === "system" && entry.targetRole !== "all") return false
    if (
      filters.selectedTargetRole !== "all" &&
      filters.selectedTargetRole !== "system" &&
      entry.targetRole !== filters.selectedTargetRole
    ) {
      return false
    }

    const createdAt = new Date(entry.createdAt)
    if (!matchesDateFilter(createdAt, filters.dateFilter, now)) return false

    if (!term) return true

    const targetLabel =
      entry.targetRole === "all" ? translateWithLocale(getCurrentLocale(), "securityAudit.system") : roleLabels[entry.targetRole]
    const haystack = [entry.details, entry.actorName, roleLabels[entry.actorRole], targetLabel, getSecurityAuditActionLabel(entry.action)]
      .join(" ")
      .toLowerCase()
    return haystack.includes(term)
  })
}

export const buildSecurityAuditStats = (entries: SecurityAuditEntry[]): SecurityAuditStats => {
  const now = new Date()
  const todayCount = entries.filter((entry) => isSameDay(new Date(entry.createdAt), now)).length
  const last7Count = entries.filter((entry) => now.getTime() - new Date(entry.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length
  const riskyChanges = entries.filter(
    (entry) =>
      entry.action === "reset_all" ||
      entry.action === "toggle_role_status" ||
      entry.action === "internal_user_delete",
  ).length
  return {
    total: entries.length,
    todayCount,
    last7Count,
    riskyChanges,
  }
}

export const exportSecurityAuditAsJson = (entries: SecurityAuditEntry[]) => {
  const payload = JSON.stringify(entries, null, 2)
  const blob = new Blob([payload], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "security-audit-log.json"
  link.click()
  URL.revokeObjectURL(url)
}

export const getSecurityAuditActionOptions = () => {
  return (Object.keys(securityAuditActionLabelKeys) as SecurityAuditAction[]).map((value) => ({
    value,
    label: getSecurityAuditActionLabel(value),
  }))
}

export const getSecurityAuditRoleOptions = () => {
  return appRoles.map((role) => ({ value: role, label: roleLabels[role] }))
}

