import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import KpiCard from "@/components/shared/KpiCard"
import PageHeader from "@/components/shared/PageHeader"
import { formatCurrency } from "@/lib/currency"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { getInvoices } from "@/modules/invoices/services/invoicesApi"
import type { Invoice } from "@/modules/invoices/types/invoice"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
import PaymentsTable from "../components/PaymentsTable"
import { normalizePaymentsQuery } from "../lib/query"
import { getPaymentsPage } from "../services/paymentsApi"
import type { Payment, PaymentStatus, PaymentsPageMeta } from "../types/payment"

const initialSearch = ""
const initialStatus = ""
const defaultMeta: PaymentsPageMeta = { page: 1, perPage: 25, total: 0, totalPages: 1 }

const PaymentsListPage = () => {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [statusInput, setStatusInput] = useState<PaymentStatus | "">(initialStatus)
  const [appliedSearch, setAppliedSearch] = useState(initialSearch)
  const [appliedStatus, setAppliedStatus] = useState<PaymentStatus | "">(initialStatus)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [currency, setCurrency] = useState("COP")
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [meta, setMeta] = useState<PaymentsPageMeta>(defaultMeta)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManagePayments = useCan("payments.manual.write")
  const canReadInvoices = useCan("invoices.read")

  const statusOptions: { label: string; value: PaymentStatus }[] = [
    { label: t("payments.status.pending"), value: "pending" },
    { label: t("payments.status.paid"), value: "paid" },
    { label: t("payments.status.overdue"), value: "overdue" },
    { label: t("payments.status.refunded"), value: "refunded" },
  ]

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const settings = await getSystemSettings()
        if (settings.currency?.trim()) setCurrency(settings.currency)
      } catch {
        // fallback COP
      }
    }
    void loadCurrency()
  }, [])

  useEffect(() => {
    const loadInvoices = async () => {
      if (!canReadInvoices) {
        setInvoices([])
        return
      }
      try {
        const data = await getInvoices({ cancel: false })
        setInvoices(data)
      } catch {
        setInvoices([])
      }
    }

    void loadInvoices()
  }, [canReadInvoices])

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const query = normalizePaymentsQuery({
        search: appliedSearch,
        status: appliedStatus,
        page,
        perPage,
      })
      const data = await getPaymentsPage(query)
      setPayments(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(getErrorMessage(err, t("payments.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, appliedStatus, page, perPage, t])

  useEffect(() => {
    void loadPayments()
  }, [loadPayments])

  const summary = useMemo(() => {
    const totals = payments.reduce(
      (acc, payment) => {
        acc.total += payment.amount
        if (payment.status === "paid") acc.paid += payment.amount
        if (payment.status === "pending" || payment.status === "overdue") acc.pending += payment.amount
        return acc
      },
      { total: 0, paid: 0, pending: 0 },
    )
    return {
      totalPayments: meta.total,
      paidAmount: totals.paid,
      pendingAmount: totals.pending,
      listedAmount: totals.total,
    }
  }, [meta.total, payments])

  const formatAmount = useCallback((value: number) => formatCurrency(value, currency, locale === "es" ? "es-CO" : "en-US"), [currency, locale])
  const formatDate = useCallback(
    (value: string) =>
      new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value)),
    [locale],
  )

  const handleSearch = () => {
    setAppliedSearch(searchInput)
    setAppliedStatus(statusInput)
    setPage(1)
  }

  const handleClear = () => {
    setSearchInput(initialSearch)
    setStatusInput(initialStatus)
    setAppliedSearch(initialSearch)
    setAppliedStatus(initialStatus)
    setPage(1)
    setPerPage(25)
  }

  const inputId = (field: string) => `payments-list-${field}`
  const invoiceByNumber = useMemo(() => new Map(invoices.map((invoice) => [invoice.invoiceNumber, invoice])), [invoices])

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        actions={
          <>
            <Button variant="outline" onClick={() => void loadPayments()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("payments.refresh")}
            </Button>
            <Button
              onClick={() => navigate("/payments/new")}
              disabled={!canManagePayments}
              title={!canManagePayments ? t("payments.permissionCreate") : undefined}
            >
              {t("payments.create")}
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("payments.summary.totalItems")} value={String(summary.totalPayments)} />
        <KpiCard label={t("payments.summary.paidAmount")} value={formatAmount(summary.paidAmount)} />
        <KpiCard label={t("payments.summary.pendingAmount")} value={formatAmount(summary.pendingAmount)} />
        <KpiCard label={t("payments.summary.listedAmount")} value={formatAmount(summary.listedAmount)} />
      </section>

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("payments.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("payments.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("payments.filterStatus")}
            </Label>
            <select
              id={inputId("status")}
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value as PaymentStatus | "")}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("payments.all")}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button className="h-9" onClick={handleSearch} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {t("payments.searchButton")}
          </Button>
          <Button className="h-9" variant="outline" onClick={handleClear} disabled={loading}>
            {t("payments.filters.clear")}
          </Button>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("payments.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("payments.loadErrorTitle")} description={error} />
      ) : payments.length === 0 ? (
        <StateMessage variant="empty" title={t("payments.emptyTitle")} />
      ) : (
        <div className="grid gap-3">
          <PaymentsTable
            payments={payments}
            formatAmount={formatAmount}
            formatDate={formatDate}
            onViewDetail={(id) => navigate(`/payments/detail/${id}`)}
            onViewStatus={(clientId, clientName) => navigate(`/payments/account-status/${clientId}`, { state: { clientName } })}
            onViewInvoice={
              canReadInvoices
                ? (invoiceNumber) => {
                    const invoice = invoiceByNumber.get(invoiceNumber)
                    if (invoice) navigate(`/invoices/${invoice.id}`)
                  }
                : undefined
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              {t("payments.pagination.summary", {
                page: meta.page,
                totalPages: meta.totalPages,
                total: meta.total,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-muted-foreground">
                <span>{t("payments.pagination.perPage")}</span>
                <select
                  className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                  value={perPage}
                  onChange={(event) => {
                    const next = Number.parseInt(event.target.value, 10)
                    setPerPage(Number.isFinite(next) ? next : 25)
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={meta.page <= 1}>
                {t("payments.pagination.prev")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                disabled={meta.page >= meta.totalPages}
              >
                {t("payments.pagination.next")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentsListPage
