import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import type { SecurityAuditStats as SecurityAuditStatsType } from "../types/securityAudit"

interface SecurityAuditStatsProps {
  stats: SecurityAuditStatsType
}

const SecurityAuditStats = ({ stats }: SecurityAuditStatsProps) => {
  const { t } = useI18n()

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.total")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.today")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.todayCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.last7")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.last7Count}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">{t("securityAudit.stats.risky")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.riskyChanges}</p>
        </CardContent>
      </Card>
    </section>
  )
}

export default SecurityAuditStats
