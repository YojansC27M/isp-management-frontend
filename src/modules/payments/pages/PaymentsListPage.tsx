import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { getErrorMessage } from "@/lib/errors"
import PaymentsTable from "../components/PaymentsTable"
import { getPayments } from "../services/paymentsApi"
import type { Payment, PaymentStatus } from "../types/payment"
import { useI18n } from "@/i18n/i18nContext"

const inputId = (field: string) => `payments-list-${field}`

const PaymentsListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManagePayments = useCan("payments.write")
  const statusOptions: { label: string; value: PaymentStatus }[] = [
    { label: t("payments.status.pending"), value: "pending" },
    { label: t("payments.status.paid"), value: "paid" },
    { label: t("payments.status.overdue"), value: "overdue" },
  ]

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getPayments()
      setPayments(data)
    } catch (err) {
      setError(getErrorMessage(err, t("payments.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesSearch = [payment.clientName, payment.invoiceNumber].join(" ").toLowerCase().includes(term)
      const matchesStatus = statusFilter ? payment.status === statusFilter : true
      return matchesSearch && matchesStatus
    })
  }, [payments, search, statusFilter])

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        actions={
          <Button
            onClick={() => navigate("/payments/new")}
            disabled={!canManagePayments}
            title={!canManagePayments ? t("payments.permissionCreate") : undefined}
          >
            {t("payments.create")}
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("payments.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("payments.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("payments.filterStatus")}
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("payments.all")}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("payments.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("payments.loadErrorTitle")} description={error} />
      ) : filteredPayments.length === 0 ? (
        <StateMessage variant="empty" title={t("payments.emptyTitle")} />
      ) : (
        <PaymentsTable
          payments={filteredPayments}
          onViewStatus={(clientId, clientName) => navigate(`/payments/account-status/${clientId}`, { state: { clientName } })}
        />
      )}
    </div>
  )
}

export default PaymentsListPage
