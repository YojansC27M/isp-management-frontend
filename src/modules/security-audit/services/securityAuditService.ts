import { readSecurityAudit, type SecurityAuditAction, type SecurityAuditEntry } from "@/auth/auditLog"
import { appRoles, roleLabels } from "@/auth/permissions"
import type { SecurityAuditDateFilter, SecurityAuditFilters, SecurityAuditStats } from "../types/securityAudit"

export const securityAuditActionLabels: Record<SecurityAuditAction, string> = {
  save: "Guardar perfil",
  save_all: "Guardar todos los perfiles",
  toggle_role_status: "Cambio de estado de perfil",
  reset_role: "Restaurar perfil",
  reset_all: "Restaurar todos",
  internal_user_create: "Crear usuario interno",
  internal_user_update: "Actualizar usuario interno",
  internal_user_delete: "Eliminar usuario interno",
  technician_assignment: "Asignacion de tecnico",
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
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate))
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

    const targetLabel = entry.targetRole === "all" ? "Sistema" : roleLabels[entry.targetRole]
    const haystack = [entry.details, entry.actorName, roleLabels[entry.actorRole], targetLabel, securityAuditActionLabels[entry.action]]
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
  return Object.entries(securityAuditActionLabels).map(([value, label]) => ({
    value: value as SecurityAuditAction,
    label,
  }))
}

export const getSecurityAuditRoleOptions = () => {
  return appRoles.map((role) => ({ value: role, label: roleLabels[role] }))
}

