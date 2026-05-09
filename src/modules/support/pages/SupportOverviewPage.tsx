import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, CalendarClock, RefreshCw, Ticket } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { getSupportOverview } from "../services/supportApi"
import type { SupportOverviewPayload } from "../types/support"

const windows = [7, 14, 30]

const localeByCode = {
  es: "es-CO",
  en: "en-US",
} as const

const formatDateTime = (value: string, locale: "es" | "en") =>
  Number.isNaN(new Date(value).getTime())
    ? "—"
    : new Intl.DateTimeFormat(localeByCode[locale], {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))

const formatDateOnly = (value: string, locale: "es" | "en") =>
  Number.isNaN(new Date(value).getTime())
    ? "—"
    : new Intl.DateTimeFormat(localeByCode[locale], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))

const percent = (value: number, total: number) => {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

const SupportOverviewPage = () => {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [overview, setOverview] = useState<SupportOverviewPayload | null>(null)

  const loadOverview = useCallback(async (windowDays: number) => {
    setLoading(true)
    setError("")
    try {
      const data = await getSupportOverview(windowDays)
      setOverview(data)
    } catch (err) {
      setError(getErrorMessage(err, t("common.errorLoading")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadOverview(days)
  }, [days, loadOverview])

  const content = useMemo(() => {
    if (!overview) return null

    const activeTickets = overview.tickets.open + overview.tickets.inProgress + overview.tickets.waiting
    const resolvedShare = percent(overview.tickets.resolved, overview.tickets.total)
    const visitCompletionShare = percent(overview.visits.completed, overview.visits.total)
    const windowStartLabel = overview.windowStartAt ? formatDateOnly(overview.windowStartAt, locale) : t("support.overview.windowUnknown")
    const windowEndLabel = formatDateOnly(overview.generatedAt, locale)
    const generatedAtLabel = formatDateTime(overview.generatedAt, locale)
    const recentActivity = overview.recentTicketActivity.map((ticket) => ({
      ...ticket,
      updatedAtLabel: formatDateTime(ticket.updatedAt, locale),
    }))

    return {
      activeTickets,
      resolvedShare,
      visitCompletionShare,
      windowStartLabel,
      windowEndLabel,
      generatedAtLabel,
      recentActivity,
    }
  }, [locale, overview, t])

  if (loading && !overview) return <StateMessage variant="loading" title={t("support.overview.loading")} />
  if (error && !overview) return <StateMessage variant="error" title={t("support.overview.errorTitle")} description={error} />
  if (!overview || !content) return <StateMessage variant="empty" title={t("support.overview.emptyTitle")} />

  const ticketStatusRows = [
    { label: t("tickets.status.open"), value: overview.tickets.open },
    { label: t("tickets.status.in_progress"), value: overview.tickets.inProgress },
    { label: t("tickets.status.waiting"), value: overview.tickets.waiting },
    { label: t("tickets.status.resolved"), value: overview.tickets.resolved },
    { label: t("tickets.status.closed"), value: overview.tickets.closed },
  ]

  const visitStatusRows = [
    { label: t("visits.status.scheduled"), value: overview.visits.scheduled },
    { label: t("visits.status.in_progress"), value: overview.visits.inProgress },
    { label: t("visits.status.completed"), value: overview.visits.completed },
    { label: t("visits.status.canceled"), value: overview.visits.canceled },
    { label: t("support.overview.overdueLabel"), value: overview.visits.overdueScheduled },
  ]

  const quickActions = [
    {
      label: t("support.overview.quickTickets"),
      description: t("tickets.title"),
      href: "/tickets",
      icon: Ticket,
    },
    {
      label: t("support.overview.quickNewTicket"),
      description: t("tickets.create"),
      href: "/tickets/new",
      icon: Ticket,
    },
    {
      label: t("support.overview.quickVisits"),
      description: t("visits.title"),
      href: "/visits",
      icon: CalendarClock,
    },
    {
      label: t("support.overview.quickNewVisit"),
      description: t("visits.createTitle"),
      href: "/visits/new",
      icon: CalendarClock,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(120deg,#09111f,#143a66_48%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">{t("support.overview.snapshotLabel")}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t("support.overview.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/90">{t("support.overview.description")}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                className="bg-card text-foreground hover:bg-muted"
                onClick={() => void loadOverview(days)}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? t("common.loading") : t("support.overview.refresh")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                onClick={() => navigate("/tickets")}
              >
                {t("support.overview.quickTickets")}
              </Button>
              <Button
                variant="outline"
                className="border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                onClick={() => navigate("/visits")}
              >
                {t("support.overview.quickVisits")}
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {windows.map((window) => (
                <Button
                  key={window}
                  variant={window === days ? "default" : "outline"}
                  className={
                    window === days
                      ? ""
                      : "border-white/45 bg-white/5 text-white hover:bg-white/15 focus-visible:ring-white/40"
                  }
                  onClick={() => setDays(window)}
                >
                  {window}d
                </Button>
              ))}
            </div>
            <p className="mt-4 max-w-2xl text-xs text-slate-100/80">
              {t("support.overview.windowHint", { days })}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-cyan-100">{t("support.overview.snapshotLabel")}</p>
                <p className="mt-1 text-xs text-slate-100/80">
                  {t("support.overview.lastSync")}: {content.generatedAtLabel}
                </p>
                <p className="mt-1 text-xs text-slate-100/70">
                  {t("support.overview.windowStart")}: {content.windowStartLabel}
                  {" "}
                  {t("support.overview.windowEnd")}: {content.windowEndLabel}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-soft-pulse" />
                {t("support.overview.snapshotLabel")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("support.overview.kpi.totalTickets")}</p>
                <p className="text-lg font-semibold">{overview.tickets.total}</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("support.overview.kpi.activeTickets")}</p>
                <p className="text-lg font-semibold">{content.activeTickets}</p>
              </div>
              <div className="rounded-xl bg-white/8 p-3">
                <p className="text-xs text-cyan-100/90">{t("support.overview.kpi.overdueVisits")}</p>
                <p className="text-lg font-semibold">{overview.visits.overdueScheduled}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("support.overview.kpi.totalTickets")} value={String(overview.tickets.total)} />
        <KpiCard label={t("support.overview.kpi.activeTickets")} value={String(content.activeTickets)} />
        <KpiCard label={t("support.overview.kpi.scheduledVisits")} value={String(overview.visits.scheduled)} />
        <KpiCard label={t("support.overview.kpi.overdueVisits")} value={String(overview.visits.overdueScheduled)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("support.overview.section.ticketStatus")}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {t("support.overview.ticketResolutionRate", { value: content.resolvedShare })}
            </span>
          </CardHeader>
          <CardContent className="grid gap-4">
            {ticketStatusRows.map((row) => {
              const rowPercent = percent(row.value, overview.tickets.total)
              return (
                <div key={row.label} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <strong className="text-foreground">{row.value}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${rowPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("support.overview.section.visitStatus")}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {t("support.overview.completionRate", { value: content.visitCompletionShare })}
            </span>
          </CardHeader>
          <CardContent className="grid gap-4">
            {visitStatusRows.map((row) => {
              const rowPercent = percent(row.value, overview.visits.total)
              return (
                <div key={row.label} className="grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <strong className="text-foreground">{row.value}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${rowPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("support.overview.section.recentActivity")}</CardTitle>
            <span className="text-xs text-muted-foreground">
              {t("support.overview.windowLabel")}: {days}d
            </span>
          </CardHeader>
          <CardContent>
            {content.recentActivity.length === 0 ? (
              <StateMessage
                variant="empty"
                title={t("support.overview.activityEmptyTitle")}
                description={t("support.overview.activityEmptyDescription")}
              />
            ) : (
              <div className="grid gap-3">
                {content.recentActivity.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-border/70 bg-muted/25 px-4 py-3 transition hover:-translate-y-0.5 hover:bg-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{ticket.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{ticket.clientName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {t(`tickets.status.${ticket.status}`)}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {t(`tickets.priority.${ticket.priority}`)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{ticket.updatedAtLabel}</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        {t("tickets.table.view")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("support.overview.section.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => navigate(action.href)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default SupportOverviewPage
