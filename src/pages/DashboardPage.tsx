import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, AlertTriangle, ArrowUpRight, CalendarClock, Signal, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"

const metrics = [
  { labelKey: "dashboard.metric.activeClients", value: "2,458", trend: "+4.2%", icon: Users, positive: true },
  { labelKey: "dashboard.metric.openTickets", value: "37", trend: "-8.5%", icon: AlertTriangle, positive: true },
  { labelKey: "dashboard.metric.visitsToday", value: "14", trend: "+2.1%", icon: CalendarClock, positive: true },
  { labelKey: "dashboard.metric.avgLatency", value: "18 ms", trend: "-1.4 ms", icon: Signal, positive: true },
]

type IncidentSeverity = keyof typeof severityTone

const incidents: Array<{ titleKey: string; detailKey: string; severity: IncidentSeverity }> = [
  { titleKey: "dashboard.incident.routerNorth", detailKey: "dashboard.incident.routerNorthDetail", severity: "high" },
  { titleKey: "dashboard.incident.ticket1021", detailKey: "dashboard.incident.ticket1021Detail", severity: "medium" },
  { titleKey: "dashboard.incident.overdueBilling", detailKey: "dashboard.incident.overdueBillingDetail", severity: "low" },
]

const severityTone = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
} as const

const DashboardPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()

  const currentDateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
  }, [])

  return (
    <div className="space-y-6">
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(115deg,#0b132b,#163a63_45%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.8)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">{t("dashboard.heroTag")}</p>
            <h1 className="mt-3 text-3xl font-semibold">{t("dashboard.heroTitle")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/90">
              {t("dashboard.heroDescription")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button className="bg-card text-foreground hover:bg-muted" onClick={() => navigate("/monitoring")}>
                {t("dashboard.goMonitoring")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40 dark:border-white/40 dark:bg-slate-900/20 dark:hover:bg-slate-900/35"
                onClick={() => navigate("/tickets")}
              >
                {t("dashboard.reviewTickets")}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-card/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cyan-100">{t("dashboard.operationStatus")}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-soft-pulse" />
                {t("dashboard.online")}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-100/80 capitalize">{currentDateLabel}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">{t("dashboard.routers")}</p>
                <p className="text-lg font-semibold">12</p>
              </div>
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">{t("dashboard.uptime")}</p>
                <p className="text-lg font-semibold">99.8%</p>
              </div>
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">{t("dashboard.alerts")}</p>
                <p className="text-lg font-semibold">3</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-delay-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.labelKey} className="border-border bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t(metric.labelKey)}</CardTitle>
                  <span className="rounded-lg bg-sky-100 p-1.5 text-sky-700">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-semibold text-foreground">{metric.value}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      metric.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {metric.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="animate-fade-up-delay-2 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-border bg-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("dashboard.networkActivity")}</CardTitle>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {t("dashboard.latestPeaks")}
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { label: "08:00", value: 48 },
                { label: "10:00", value: 62 },
                { label: "12:00", value: 78 },
                { label: "14:00", value: 58 },
                { label: "16:00", value: 71 },
              ].map((point) => (
                <div key={point.label} className="grid grid-cols-[65px_1fr_38px] items-center gap-3">
                  <span className="text-xs text-muted-foreground">{point.label}</span>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${point.value}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">{point.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>{t("dashboard.pendingAlerts")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {incidents.map((incident) => (
              <article
                key={incident.titleKey}
                className="rounded-lg border border-border bg-muted/40 p-3 transition hover:border-border hover:bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{t(incident.titleKey)}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityTone[incident.severity]}`}>
                    {t(`dashboard.severity.${incident.severity}`)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t(incident.detailKey)}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
