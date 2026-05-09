import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowRight, CalendarDays, CreditCard, MessageSquare, Pencil, Ticket as TicketIcon } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KeyValueSummaryGrid from "@/components/shared/KeyValueSummaryGrid"
import KpiCard from "@/components/shared/KpiCard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCan } from "@/auth/usePermission"
import { normalizeApiError } from "@/api/apiError"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getClientById } from "../services/clientsApi"
import { getAccountStatusByClient } from "@/modules/payments/services/paymentsApi"
import { getPayments } from "@/modules/payments/services/paymentsApi"
import { getInvoices } from "@/modules/invoices/services/invoicesApi"
import { getClientInstallation, getClientInstallationMovements } from "@/modules/installations/services/installationsApi"
import { getClientTickets } from "@/modules/tickets/services/ticketsApi"
import { getClientVisits } from "@/modules/visits/services/visitsApi"
import type { Client } from "../types/client"
import type { AccountStatusItem, Payment } from "@/modules/payments/types/payment"
import type { Invoice } from "@/modules/invoices/types/invoice"
import type { Installation, InstallationMovement } from "@/modules/installations/types/installation"
import type { Ticket } from "@/modules/tickets/types/ticket"
import type { Visit } from "@/modules/visits/types/visit"

const statusTone: Record<Client["status"], string> = {
  active: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  suspended: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  inactive: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
}

const paymentTone = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-rose-100 text-rose-800",
  refunded: "bg-slate-200 text-slate-700",
  cancelled: "bg-slate-200 text-slate-700",
} as const

const formatMoney = (value: number) => `$${value.toFixed(2)}`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const sortDesc = (a: string, b: string) => b.localeCompare(a)

const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { notify } = useUI()
  const canEditClients = useCan("clients.write")
  const canReadPayments = useCan("payments.read")
  const canReadInvoices = useCan("invoices.read")
  const canReadTickets = useCan("tickets.read")
  const canReadVisits = useCan("visits.read")
  const canCreateTickets = useCan("tickets.write")
  const canRegisterPayments = useCan("payments.manual.write")
  const canScheduleVisits = useCan("visits.write")

  const [client, setClient] = useState<Client | null>(null)
  const [accountStatus, setAccountStatus] = useState<AccountStatusItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [installationMovements, setInstallationMovements] = useState<InstallationMovement[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (!id) return
      setLoading(true)
      setError("")
      try {
        const clientData = await getClientById(id)
        setClient(clientData)

        const relatedRequests: Array<Promise<void>> = []

        if (canReadPayments) {
          relatedRequests.push(
            getAccountStatusByClient(id, { cancel: false }).then((data) => {
              setAccountStatus(data)
            }),
          )
          relatedRequests.push(
            getPayments({ cancel: false }).then((data) => {
              setPayments(data)
            }),
          )
        } else {
          setAccountStatus([])
          setPayments([])
        }

        if (canReadInvoices) {
          relatedRequests.push(
            getInvoices({ cancel: false }).then((data) => {
              setInvoices(data)
            }),
          )
        } else {
          setInvoices([])
        }

        relatedRequests.push(
          getClientInstallation(id).then((data) => {
            setInstallation(data)
          }),
        )
        relatedRequests.push(
          getClientInstallationMovements(id).then((data) => {
            setInstallationMovements(data)
          }),
        )

        if (canReadTickets) {
          relatedRequests.push(
            getClientTickets(id).then((data) => {
              setTickets(data)
            }),
          )
        } else {
          setTickets([])
        }

        if (canReadVisits) {
          relatedRequests.push(
            getClientVisits(id).then((data) => {
              setVisits(data)
            }),
          )
        } else {
          setVisits([])
        }

        const relatedResults = await Promise.allSettled(relatedRequests)
        const hasRelatedErrors = relatedResults.some((result) => {
          if (result.status !== "rejected") return false
          return normalizeApiError(result.reason).code !== "canceled"
        })
        if (hasRelatedErrors) {
          notify({
            title: t("clients.detail.loadErrorTitle"),
            description: t("clients.detail.loadErrorDefault"),
            type: "error",
          })
        }
      } catch (err) {
        setError(getErrorMessage(err, t("clients.detail.loadErrorDefault")))
        notify({
          title: t("clients.detail.loadErrorTitle"),
          description: getErrorMessage(err, t("clients.detail.loadErrorDefault")),
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [canReadInvoices, canReadPayments, canReadTickets, canReadVisits, id, notify, t])

  const accountTotals = useMemo(
    () =>
      accountStatus.reduce(
        (acc, item) => {
          if (item.status === "paid") acc.paid += item.amount
          if (item.status === "pending") acc.pending += item.amount
          if (item.status === "overdue") acc.overdue += item.amount
          return acc
        },
        { paid: 0, pending: 0, overdue: 0 },
      ),
    [accountStatus],
  )

  const relatedPayments = useMemo(() => payments.filter((payment) => payment.clientId === id), [id, payments])
  const relatedInvoices = useMemo(() => invoices.filter((invoice) => invoice.clientId === id), [id, invoices])
  const relatedVisits = useMemo(() => visits.filter((visit) => visit.clientId === id), [id, visits])
  const relatedTickets = tickets

  const openTickets = relatedTickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress")
  const upcomingVisits = relatedVisits.filter((visit) => visit.status === "scheduled" || visit.status === "in_progress")
  const pendingInvoices = relatedInvoices.filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
  const installationStateLabel = installation ? t(`installation.status.${installation.status}`) : ""
  const installationMovementCount = installationMovements.length

  const activityFeed = useMemo(
    () =>
      [
        ...relatedTickets.map((ticket) => ({
          id: `ticket-${ticket.id}`,
          kind: t("tickets.title"),
          title: ticket.title,
          description: `${t(`tickets.status.${ticket.status}`)} · ${t(`tickets.priority.${ticket.priority}`)}`,
          date: ticket.createdAt,
        })),
        ...relatedPayments.map((payment) => ({
          id: `payment-${payment.id}`,
          kind: t("payments.title"),
          title: payment.invoiceNumber,
          description: `${payment.paymentMethod.toUpperCase()} · ${formatMoney(payment.amount)}`,
          date: payment.paymentDate,
        })),
        ...relatedInvoices.map((invoice) => ({
          id: `invoice-${invoice.id}`,
          kind: t("invoices.title"),
          title: invoice.invoiceNumber,
          description: `${t(`invoices.status.${invoice.status}`)} · ${formatMoney(invoice.amount)}`,
          date: invoice.issueDate,
        })),
        ...relatedVisits.map((visit) => ({
          id: `visit-${visit.id}`,
          kind: t("visits.title"),
          title: `${visit.scheduledDate} ${visit.scheduledTime}`,
          description: `${t(`visits.status.${visit.status}`)} · ${visit.zone}`,
          date: visit.scheduledDate,
        })),
      ]
        .sort((a, b) => sortDesc(a.date, b.date))
        .slice(0, 6),
    [relatedInvoices, relatedPayments, relatedTickets, relatedVisits, t],
  )

  const statusLabel = client ? t(`clients.status.${client.status}`) : ""

  if (loading) return <StateMessage variant="loading" title={t("clients.detail.loading")} />
  if (error) return <StateMessage variant="error" title={t("clients.detail.loadErrorTitle")} description={error} />
  if (!client) return <StateMessage variant="empty" title={t("clients.detail.notFound")} />

  const coordinateLabel =
    client.latitude != null && client.longitude != null ? `${client.latitude.toFixed(4)}, ${client.longitude.toFixed(4)}` : "—"

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#0f172a,#1d4ed8_55%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.85)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">{t("clients.detail.title")}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{client.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-cyan-50/90">{t("clients.detail.description")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone[client.status]}`}>
                {statusLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {client.plan}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                {client.ipAddress}
              </span>
            </div>
            <p className="max-w-2xl text-sm text-cyan-50/90">{client.document} · {client.email} · {client.phone}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[380px] lg:grid-cols-2">
            <Button
              className="bg-white text-slate-900 hover:bg-cyan-50"
              disabled={!canEditClients}
              title={!canEditClients ? t("clients.permissionEdit") : undefined}
              onClick={() => navigate(`/clients/${client.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("clients.detail.edit")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canCreateTickets}
              title={!canCreateTickets ? t("tickets.permissionCreate") : undefined}
              onClick={() => navigate("/tickets/new", { state: { clientId: client.id, clientName: client.name } })}
            >
              <TicketIcon className="mr-2 h-4 w-4" />
              {t("clients.detail.openTicket")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canRegisterPayments}
              title={!canRegisterPayments ? t("payments.permissionCreate") : undefined}
              onClick={() => navigate("/payments/new", { state: { clientId: client.id, clientName: client.name } })}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t("clients.detail.registerPayment")}
            </Button>
            <Button
              variant="outline"
              className="border-white/35 bg-white/5 text-white hover:bg-white/10"
              disabled={!canScheduleVisits}
              title={!canScheduleVisits ? t("visits.permissionCreate") : undefined}
              onClick={() => navigate("/visits/new", { state: { clientId: client.id, clientName: client.name } })}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("clients.detail.scheduleVisit")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("clients.detail.openTickets")} value={String(openTickets.length)} />
        <KpiCard label={t("clients.detail.pendingBalance")} value={formatMoney(accountTotals.pending + accountTotals.overdue)} />
        <KpiCard label={t("clients.detail.upcomingVisits")} value={String(upcomingVisits.length)} />
        <KpiCard label={t("clients.detail.lastActivity")} value={activityFeed[0] ? formatDate(activityFeed[0].date) : "—"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <KeyValueSummaryGrid
          items={[
            { label: t("clients.detail.document"), value: client.document },
            { label: t("clients.detail.address"), value: client.address || "—" },
            { label: t("clients.detail.phone"), value: client.phone },
            { label: t("clients.detail.email"), value: client.email },
            { label: t("clients.detail.plan"), value: client.plan },
            { label: t("clients.detail.ip"), value: client.ipAddress },
            { label: t("clients.detail.coordinates"), value: coordinateLabel },
            { label: t("clients.detail.status"), value: statusLabel },
          ]}
        />

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("clients.detail.billing")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => navigate(`/payments/account-status/${client.id}`, { state: { clientName: client.name } })}
            >
              {t("payments.table.viewAccountStatus")}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard label={t("payments.status.paid")} value={formatMoney(accountTotals.paid)} />
              <KpiCard label={t("payments.status.pending")} value={formatMoney(accountTotals.pending)} />
              <KpiCard label={t("payments.status.overdue")} value={formatMoney(accountTotals.overdue)} />
            </div>
            {pendingInvoices.length > 0 ? (
              <div className="grid gap-2">
                {pendingInvoices.slice(0, 3).map((invoice) => (
                  <article key={invoice.id} className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentTone[invoice.status]}`}>
                          {t(`invoices.status.${invoice.status}`)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          {t("clients.detail.openInvoice")}
                        </Button>
                        {canRegisterPayments ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2.5 text-xs"
                            onClick={() =>
                              navigate("/payments/new", {
                                state: { clientId: client.id, clientName: client.name, invoiceNumber: invoice.invoiceNumber },
                              })
                            }
                          >
                            {t("clients.detail.registerPaymentForInvoice")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{t("installation.client.title")}</CardTitle>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {installationMovementCount} {t("installation.history.countSuffix")}
              </span>
            </div>
            {installation ? (
              <Button
                variant="outline"
                disabled={!canScheduleVisits}
                title={!canScheduleVisits ? t("visits.permissionManage") : undefined}
                onClick={() => navigate(`/installations/${installation.id}/edit`)}
              >
                {t("installation.client.edit")}
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={!canScheduleVisits}
                title={!canScheduleVisits ? t("visits.permissionManage") : undefined}
                onClick={() => navigate("/installations/new", { state: { clientId: client.id, clientName: client.name } })}
              >
                {t("installation.client.create")}
              </Button>
            )}
          </CardHeader>
          <CardContent className="grid gap-3">
            {installation ? (
              <div className="grid gap-3 md:grid-cols-2">
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.router")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{installation.routerName || t("installation.client.noRouter")}</p>
                  {installation.routerIp ? <p className="mt-1 text-xs text-muted-foreground">{installation.routerIp}</p> : null}
                </article>
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.status")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{installationStateLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{installation.clientPlan}</p>
                </article>
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.operationType")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{t(`installation.operationType.${installation.operationType}`)}</p>
                </article>
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.visit")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {installation.visitScheduledAt
                      ? formatDate(installation.visitScheduledAt)
                      : installation.visitId
                        ? t("installation.client.noDate")
                        : t("installation.client.noVisit")}
                  </p>
                </article>
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.installedAt")}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{installation.installedAt ? formatDate(installation.installedAt) : t("common.empty")}</p>
                </article>
                <article className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 md:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.notes")}</p>
                  <p className="mt-1 text-sm text-foreground">{installation.notes || t("installation.client.noNotes")}</p>
                </article>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("installation.client.empty")}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("installation.history.title")}</CardTitle>
            <span className="text-xs text-muted-foreground">{t("installation.history.description")}</span>
          </CardHeader>
          <CardContent>
            {installationMovements.length > 0 ? (
              <div className="grid gap-3">
                {installationMovements
                  .slice()
                  .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))
                  .map((movement) => (
                    <article key={movement.id} className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t(`installation.operationType.${movement.operationType}`)}</p>
                          <p className="text-xs text-muted-foreground">
                            {movement.routerName || t("installation.client.noRouter")} · {movement.visitId ? t("installation.history.linkedVisit") : t("installation.history.noVisit")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{movement.notes || t("installation.client.noNotes")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("installation.form.status")}</p>
                          <p className="text-sm font-medium text-foreground">{t(`installation.status.${movement.status}`)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(movement.happenedAt)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("installation.history.empty")}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("clients.detail.recentTickets")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {relatedTickets.length > 0 ? (
              relatedTickets
                .slice()
                .sort((a, b) => sortDesc(a.createdAt, b.createdAt))
                .slice(0, 3)
                .map((ticket) => (
                  <article key={ticket.id} className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.clientName} · {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {t(`tickets.status.${ticket.status}`)}
                        </span>
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 font-semibold text-cyan-700">
                          {t(`tickets.priority.${ticket.priority}`)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("clients.detail.recentVisits")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {relatedVisits.length > 0 ? (
              relatedVisits
                .slice()
                .sort((a, b) => sortDesc(a.scheduledDate, b.scheduledDate))
                .slice(0, 3)
                .map((visit) => (
                  <article key={visit.id} className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{visit.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {visit.scheduledDate} · {visit.scheduledTime} · {visit.zone}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {t(`visits.status.${visit.status}`)}
                      </span>
                    </div>
                  </article>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("clients.detail.recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {relatedInvoices.length > 0 ? (
              relatedInvoices
                .slice()
                .sort((a, b) => sortDesc(a.issueDate, b.issueDate))
                .slice(0, 3)
                .map((invoice) => (
                  <article key={invoice.id} className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.issueDate)} · {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentTone[invoice.status]}`}>
                        {t(`invoices.status.${invoice.status}`)}
                      </span>
                    </div>
                  </article>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{t("clients.detail.recentPayments")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {relatedPayments.length > 0 ? (
              relatedPayments
                .slice()
                .sort((a, b) => sortDesc(a.paymentDate, b.paymentDate))
                .slice(0, 3)
                .map((payment) => (
                  <article key={payment.id} className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{payment.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)} · {payment.paymentMethod.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatMoney(payment.amount)}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paymentTone[payment.status]}`}>
                          {t(`payments.status.${payment.status}`)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t("clients.detail.activity")}</CardTitle>
          <div className="text-xs text-muted-foreground">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
            {t("clients.detail.lastActivity")}: {activityFeed[0] ? formatDate(activityFeed[0].date) : "—"}
          </div>
        </CardHeader>
        <CardContent>
          {activityFeed.length > 0 ? (
            <div className="grid gap-3">
              {activityFeed.map((item) => (
                <article key={item.id} className="rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.kind}</p>
                      <p className="mt-1 font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("clients.detail.noData")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientDetailPage
