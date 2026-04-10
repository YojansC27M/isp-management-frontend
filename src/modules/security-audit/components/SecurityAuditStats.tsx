import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SecurityAuditStats as SecurityAuditStatsType } from "../types/securityAudit"

interface SecurityAuditStatsProps {
  stats: SecurityAuditStatsType
}

const SecurityAuditStats = ({ stats }: SecurityAuditStatsProps) => {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Eventos totales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Cambios hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.todayCount}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Ultimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.last7Count}</p>
        </CardContent>
      </Card>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Cambios sensibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-foreground">{stats.riskyChanges}</p>
        </CardContent>
      </Card>
    </section>
  )
}

export default SecurityAuditStats

