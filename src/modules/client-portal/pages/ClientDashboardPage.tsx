import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { clearClientToken } from "@/auth/session"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import ClientSummaryCard from "../components/ClientSummaryCard"
import { getInvoices, getProfile, getTickets } from "../services/clientPortalApi"
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

  const invoiceSummary = useMemo(() => {
    const pending = invoices.filter((invoice) => invoice.status === "pending").length
    const paid = invoices.filter((invoice) => invoice.status === "paid").length
    return { pending, paid }
  }, [invoices])

  if (loading) return <StateMessage variant="loading" title={t("clientPortal.dashboard.loading")} />
  if (error) return <StateMessage variant="error" title={t("clientPortal.dashboard.loadErrorTitle")} description={error} />
  if (!profile) return <StateMessage variant="empty" title={t("clientPortal.dashboard.emptyProfile")} />

  return (
    <div className="grid gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("clientPortal.dashboard.welcome", { name: profile.name })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clientPortal.dashboard.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          {t("header.logout")}
        </Button>
      </header>

      <ClientSummaryCard profile={profile} />

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">{t("nav.invoices")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("clientPortal.dashboard.pending", { count: invoiceSummary.pending })}</p>
          <p className="text-sm text-muted-foreground">{t("clientPortal.dashboard.paid", { count: invoiceSummary.paid })}</p>
          <Button className="mt-3" variant="outline" onClick={() => navigate("/client/payments")}>
            {t("clientPortal.dashboard.viewPayments")}
          </Button>
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">{t("nav.tickets")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("clientPortal.dashboard.openTickets", { count: tickets.length })}</p>
          <Button className="mt-3" variant="outline" onClick={() => navigate("/client/tickets")}>
            {t("clientPortal.dashboard.viewTickets")}
          </Button>
        </article>
      </section>
    </div>
  )
}

export default ClientDashboardPage
