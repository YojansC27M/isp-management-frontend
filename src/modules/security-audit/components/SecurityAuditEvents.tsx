import { History, ShieldCheck } from "lucide-react"
import { roleLabels } from "@/auth/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { cn } from "@/lib/utils"
import type { SecurityAuditEntry } from "../types/securityAudit"
import { formatSecurityAuditDateTime, getSecurityAuditActionLabel, securityAuditActionBadgeClass } from "../services/securityAuditService"

interface SecurityAuditEventsProps {
  entries: SecurityAuditEntry[]
}

const SecurityAuditEvents = ({ entries }: SecurityAuditEventsProps) => {
  const { t } = useI18n()

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          {t("securityAudit.events")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {t("securityAudit.noEvents")}
          </div>
        ) : (
          <ul className="grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{entry.details}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", securityAuditActionBadgeClass[entry.action])}>
                    {getSecurityAuditActionLabel(entry.action)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {entry.actorName} ({roleLabels[entry.actorRole]})
                  </span>
                  <span className="rounded-full bg-card px-2 py-0.5">
                    {t("securityAudit.affectedProfile")}:{" "}
                    {entry.targetRole === "all" ? t("securityAudit.system") : roleLabels[entry.targetRole]}
                  </span>
                  <span className="rounded-full bg-card px-2 py-0.5">{formatSecurityAuditDateTime(entry.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default SecurityAuditEvents

