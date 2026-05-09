import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, RefreshCcw } from "lucide-react"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { useCan } from "@/auth/usePermission"
import { getSystemSettings } from "@/modules/system-settings/services/systemSettingsApi"
import { formatCurrency } from "@/lib/currency"
import { getErrorMessage } from "@/lib/errors"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import InvoiceAutomationPanel from "../components/InvoiceAutomationPanel"
import InvoiceFilters from "../components/InvoiceFilters"
import InvoicesTable from "../components/InvoicesTable"
import { formatInvoiceDate, getInvoiceFinancialSummary } from "../lib/invoicePresentation"
import {
  downloadInvoicePdf,
  getInvoiceAutomationSettings,
  getInvoices,
  updateInvoiceAutomationSettings,
} from "../services/invoicesApi"
import type { Invoice, InvoiceAutomationSettings, InvoiceFiltersValues } from "../types/invoice"

const initialFilters: InvoiceFiltersValues = {
  clientName: "",
  status: "",
  dateFrom: "",
  dateTo: "",
}

const defaultSettings: InvoiceAutomationSettings = {
  cutDay: 5,
  prefix: "INV",
  nextCorrelative: 1004,
}

const defaultCurrency = "COP"

const InvoicesListPage = () => {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const { notify } = useUI()
  const [filters, setFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [filterError, setFilterError] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [settings, setSettings] = useState<InvoiceAutomationSettings>(defaultSettings)
  const [currency, setCurrency] = useState(defaultCurrency)
  const canManageInvoices = useCan("invoices.write")

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getInvoices()
      setInvoices(data)
    } catch (err) {
      setError(getErrorMessage(err, t("invoices.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadAutomationSettings = useCallback(async () => {
    try {
      const data = await getInvoiceAutomationSettings()
      setSettings(data)
    } catch {
      setSettings(defaultSettings)
    }
  }, [])

  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const data = await getSystemSettings()
        if (data.currency?.trim()) {
          setCurrency(data.currency)
        }
      } catch {
        setCurrency(defaultCurrency)
      }
    }

    void loadCurrency()
  }, [])

  useEffect(() => {
    void loadInvoices()
    void loadAutomationSettings()
  }, [loadAutomationSettings, loadInvoices])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesClient = appliedFilters.clientName
        ? invoice.clientName.toLowerCase().includes(appliedFilters.clientName.toLowerCase())
        : true
      const matchesStatus = appliedFilters.status ? invoice.status === appliedFilters.status : true
      const matchesFrom = appliedFilters.dateFrom ? invoice.issueDate >= appliedFilters.dateFrom : true
      const matchesTo = appliedFilters.dateTo ? invoice.issueDate <= appliedFilters.dateTo : true
      return matchesClient && matchesStatus && matchesFrom && matchesTo
    })
  }, [invoices, appliedFilters])

  const summary = useMemo(() => getInvoiceFinancialSummary(invoices), [invoices])

  const formatAmount = useCallback(
    (value: number) => formatCurrency(value, currency, locale === "es" ? "es-CO" : "en-US"),
    [currency, locale],
  )

  const formatDate = useCallback(
    (value: string) => formatInvoiceDate(value, locale === "es" ? "es-CO" : "en-US"),
    [locale],
  )

  const hasActiveFilters = Boolean(
    appliedFilters.clientName || appliedFilters.status || appliedFilters.dateFrom || appliedFilters.dateTo,
  )

  const validateFilters = (values: InvoiceFiltersValues) => {
    if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
      return t("invoices.filter.invalidRange")
    }
    return ""
  }

  const handleApplyFilters = () => {
    const nextError = validateFilters(filters)
    setFilterError(nextError)
    if (nextError) return
    setAppliedFilters(filters)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setFilterError("")
  }

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      const blob = await downloadInvoicePdf(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoice.invoiceNumber}.pdf`
      link.rel = "noreferrer"
      link.click()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (err) {
      notify({
        title: t("invoices.downloadErrorTitle"),
        description: getErrorMessage(err, t("invoices.downloadErrorDesc")),
        type: "error",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const saveSettings = async (nextSettings: InvoiceAutomationSettings) => {
    if (!canManageInvoices) return
    try {
      const saved = await updateInvoiceAutomationSettings(nextSettings)
      setSettings(saved)
      notify({
        title: t("invoices.settingsSavedTitle"),
        description: t("invoices.settingsSavedDescription"),
        type: "success",
      })
    } catch (err) {
      notify({
        title: t("invoices.loadErrorTitle"),
        description: getErrorMessage(err, t("invoices.loadErrorTitle")),
        type: "error",
      })
    }
  }

  const runSimulation = (nextSettings: InvoiceAutomationSettings) => {
    if (!canManageInvoices) return
    notify({
      title: t("invoices.simulationTitle"),
      description: t("invoices.simulationDescription", {
        count: filteredInvoices.length,
        prefix: nextSettings.prefix,
      }),
      type: "info",
    })
  }

  const emptyTitle = hasActiveFilters ? t("invoices.list.filteredEmptyTitle") : t("invoices.emptyTitle")
  const emptyDescription = hasActiveFilters
    ? t("invoices.list.filteredEmptyDescription")
    : t("invoices.list.emptyDescription")

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("invoices.title")}
        description={t("invoices.description")}
        actions={
          <>
            <Button
              onClick={() => navigate("/invoices/new")}
              disabled={!canManageInvoices}
              title={!canManageInvoices ? t("invoices.permissionManageSettings") : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("invoices.list.create")}
            </Button>
            <Button variant="outline" onClick={() => void loadInvoices()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("invoices.list.refresh")}
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("invoices.summary.total")} value={String(summary.totalCount)} />
        <KpiCard label={t("invoices.summary.paid")} value={formatAmount(summary.paidAmount)} />
        <KpiCard label={t("invoices.summary.pending")} value={formatAmount(summary.pendingAmount)} />
        <KpiCard label={t("invoices.summary.overdue")} value={formatAmount(summary.overdueAmount)} />
        <KpiCard label={t("invoices.summary.dueSoon")} value={String(summary.dueSoonCount)} />
      </section>

      <InvoiceAutomationPanel
        initialSettings={settings}
        onSave={saveSettings}
        onRunSimulation={runSimulation}
        canManage={canManageInvoices}
      />

      <InvoiceFilters
        values={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        errorMessage={filterError}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {t("invoices.list.visibleCount", {
            visible: filteredInvoices.length,
            total: invoices.length,
          })}
        </p>
        <p>{t("invoices.list.secureNotice")}</p>
      </div>

      {loading ? (
        <StateMessage variant="loading" title={t("invoices.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("invoices.loadErrorTitle")} description={error} />
      ) : filteredInvoices.length === 0 ? (
        <StateMessage variant="empty" title={emptyTitle} description={emptyDescription} />
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          formatAmount={formatAmount}
          formatDate={formatDate}
          downloadingId={downloadingId}
          canManage={canManageInvoices}
          onView={(id) => navigate(`/invoices/${id}`)}
          onDownload={handleDownload}
          onEdit={(id) => navigate(`/invoices/${id}/edit`)}
          onCancel={(id) => navigate(`/invoices/${id}/cancel`)}
        />
      )}
    </div>
  )
}

export default InvoicesListPage
