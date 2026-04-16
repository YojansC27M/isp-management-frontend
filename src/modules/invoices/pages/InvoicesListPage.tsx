import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import PageHeader from "@/components/shared/PageHeader"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import InvoiceAutomationPanel, { type InvoiceAutomationSettings } from "../components/InvoiceAutomationPanel"
import InvoiceFilters from "../components/InvoiceFilters"
import InvoicesTable from "../components/InvoicesTable"
import { downloadInvoicePdf, getInvoices } from "../services/invoicesApi"
import type { Invoice, InvoiceFiltersValues } from "../types/invoice"
import { useI18n } from "@/i18n/i18nContext"

const SETTINGS_KEY = "invoice_automation_settings"

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

const readSettings = (): InvoiceAutomationSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as InvoiceAutomationSettings
    if (!parsed.cutDay || !parsed.prefix || !parsed.nextCorrelative) return defaultSettings
    return parsed
  } catch {
    return defaultSettings
  }
}

const InvoicesListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { notify } = useUI()
  const [filters, setFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [settings, setSettings] = useState<InvoiceAutomationSettings>(readSettings)
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

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

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

  const handleApplyFilters = () => setAppliedFilters(filters)

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id)
    try {
      const blob = await downloadInvoicePdf(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoice.invoiceNumber}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
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

  const saveSettings = (nextSettings: InvoiceAutomationSettings) => {
    if (!canManageInvoices) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings))
    setSettings(nextSettings)
    notify({
      title: t("invoices.settingsSavedTitle"),
      description: t("invoices.settingsSavedDescription"),
      type: "success",
    })
  }

  const runSimulation = (nextSettings: InvoiceAutomationSettings) => {
    if (!canManageInvoices) return
    notify({
      title: t("invoices.simulationTitle"),
      description: t("invoices.simulationDescription", { count: filteredInvoices.length, prefix: nextSettings.prefix }),
      type: "info",
    })
  }

  return (
    <div className="grid gap-6">
      <PageHeader title={t("invoices.title")} description={t("invoices.description")} />

      <InvoiceAutomationPanel
        initialSettings={settings}
        onSave={saveSettings}
        onRunSimulation={runSimulation}
        canManage={canManageInvoices}
      />

      <InvoiceFilters values={filters} onChange={setFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading ? (
        <StateMessage variant="loading" title={t("invoices.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("invoices.loadErrorTitle")} description={error} />
      ) : filteredInvoices.length === 0 ? (
        <StateMessage variant="empty" title={t("invoices.emptyTitle")} />
      ) : (
        <InvoicesTable invoices={filteredInvoices} onView={(id) => navigate(`/invoices/${id}`)} onDownload={handleDownload} />
      )}

      {downloadingId && <p className="text-xs text-muted-foreground">{t("invoices.downloading")}</p>}
    </div>
  )
}

export default InvoicesListPage
