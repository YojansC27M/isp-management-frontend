import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import StateMessage from "@/components/feedback/StateMessage"
import { clearClientToken } from "@/auth/session"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import ClientSummaryCard from "../components/ClientSummaryCard"
import { downloadInvoicePdf, getInvoices, getProfile, getTickets } from "../services/clientPortalApi"
import type { ClientInvoice, ClientProfile, ClientTicket } from "../types/clientPortal"

const ClientDashboardPage = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [tickets, setTickets] = useState<ClientTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [profileData, invoicesData, ticketsData] = await Promise.all([getProfile(), getInvoices(), getTickets()])
      setProfile(profileData)
      setInvoices(invoicesData)
      setTickets(ticketsData)
    } catch (err) {
      setError(getErrorMessage(err, t("clientPortal.dashboard.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleLogout = () => {
    clearClientToken()
    navigate("/client/login")
  }

  const summary = useMemo(() => {
    const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending")
    const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue")
    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid")
    const activeTickets = tickets.filter(
      (ticket) => ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "waiting",
    )
    const totalBalance = pendingInvoices.reduce((acc, invoice) => acc + invoice.amount, 0)
    const latestInvoice = [...invoices].sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0]
    const latestTicket = [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

    return {
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      activeTickets,
      totalBalance,
      latestInvoice,
      latestTicket,
    }
  }, [invoices, tickets])

  const metricCards = useMemo(
    () => [
      {
        label: t("clientPortal.dashboard.metric.service"),
        value: profile?.plan ?? t("common.empty"),
        tone: "from-sky-500/20 to-cyan-500/10",
      },
      {
        label: t("clientPortal.dashboard.metric.balance"),
        value: `$${summary.totalBalance.toFixed(2)}`,
        tone: "from-amber-500/20 to-orange-500/10",
      },
      {
        label: t("clientPortal.dashboard.metric.nextDue"),
        value: profile?.nextDueDate ?? summary.latestInvoice?.dueDate ?? t("clientPortal.dashboard.noDueDate"),
        tone: "from-violet-500/20 to-indigo-500/10",
      },
      {
        label: t("clientPortal.dashboard.metric.openTickets"),
        value: String(summary.activeTickets.length),
        tone: "from-emerald-500/20 to-teal-500/10",
      },
    ],
    [profile?.nextDueDate, profile?.plan, summary.activeTickets.length, summary.latestInvoice?.dueDate, summary.totalBalance, t],
  )

  if (loading) return <StateMessage variant="loading" title={t("clientPortal.dashboard.loading")} />
  if (error) return <StateMessage variant="error" title={t("clientPortal.dashboard.loadErrorTitle")} description={error} />
  if (!profile) return <StateMessage variant="empty" title={t("clientPortal.dashboard.emptyProfile")} />

  return (
    <div className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(56,189,248,0.16),transparent_55%),radial-gradient(700px_circle_at_100%_0%,rgba(37,99,235,0.16),transparent_50%),radial-gradient(600px_circle_at_50%_100%,rgba(15,23,42,0.08),transparent_55%)] dark:bg-[radial-gradient(900px_circle_at_0%_0%,rgba(56,189,248,0.2),transparent_55%),radial-gradient(700px_circle_at_100%_0%,rgba(37,99,235,0.18),transparent_50%),radial-gradient(600px_circle_at_50%_100%,rgba(15,23,42,0.72),transparent_55%)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-border/70 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{t("clientPortal.dashboard.subtitle")}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {t("clientPortal.dashboard.welcome", { name: profile.name })}
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {t("clientPortal.dashboard.heroDescription", { plan: profile.plan })}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
                    {t("clientPortal.dashboard.serviceStatus")}: {t(`clients.status.${profile.status}`)}
                  </span>
                  <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
                    {t("clientPortal.dashboard.lastAccess")}: {profile.lastAccessAt ?? t("clientPortal.dashboard.noLastAccess")}
                  </span>
                  <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground">
                    {t("clientPortal.dashboard.accountNumber")}: {profile.accountNumber ?? profile.id}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate("/client/payments")}>
                  {t("clientPortal.dashboard.viewPayments")}
                </Button>
                <Button variant="outline" onClick={() => navigate("/client/tickets")}>
                  {t("clientPortal.dashboard.viewTickets")}
                </Button>
                <Button onClick={handleLogout}>{t("header.logout")}</Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-8">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className={cn(
                  "rounded-3xl border border-border/60 bg-gradient-to-br px-5 py-4 shadow-sm",
                  card.tone,
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-xl font-semibold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <ClientSummaryCard profile={profile} />

          <Card className="border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-2 border-b border-border/70">
              <CardTitle>{t("clientPortal.dashboard.securityTitle")}</CardTitle>
              <CardDescription>{t("clientPortal.dashboard.securityDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.pendingInvoices")}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{summary.pendingInvoices.length}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.overdueInvoices")}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{summary.overdueInvoices.length}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.serviceAddress")}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{profile.serviceAddress ?? t("clientPortal.dashboard.noServiceAddress")}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.activityTitle")}</p>
                <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("clientPortal.dashboard.latestInvoice")}</span>
                    <span className="font-medium text-foreground">{summary.latestInvoice?.invoiceNumber ?? t("clientPortal.dashboard.noData")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("clientPortal.dashboard.latestTicket")}</span>
                    <span className="font-medium text-foreground">{summary.latestTicket?.title ?? t("clientPortal.dashboard.noData")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("clientPortal.dashboard.totalPaid")}</span>
                    <span className="font-medium text-foreground">{summary.paidInvoices.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-2 border-b border-border/70">
              <CardTitle>{t("clientPortal.dashboard.paymentsTitle")}</CardTitle>
              <CardDescription>{t("clientPortal.payments.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6">
              {invoices.length > 0 ? (
                invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{invoice.dueDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("clientPortal.payments.reference")}: {invoice.paymentReference ?? invoice.invoiceNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${invoice.amount.toFixed(2)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{t(`payments.status.${invoice.status}`)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            await downloadInvoicePdf(invoice.id)
                          } catch (err) {
                            setError(getErrorMessage(err, t("clientPortal.dashboard.loadErrorDefault")))
                          }
                        }}
                      >
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <StateMessage variant="empty" title={t("clientPortal.payments.emptyTitle")} description={t("clientPortal.payments.emptyDescription")} />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="gap-2 border-b border-border/70">
              <CardTitle>{t("clientPortal.dashboard.ticketsTitle")}</CardTitle>
              <CardDescription>{t("clientPortal.tickets.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6">
              {tickets.length > 0 ? (
                tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.createdAt}
                          {ticket.updatedAt ? ` - ${ticket.updatedAt}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {t(`tickets.status.${ticket.status}`)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <StateMessage variant="empty" title={t("clientPortal.tickets.emptyTitle")} description={t("clientPortal.tickets.emptyDescription")} />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export default ClientDashboardPage
