import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import InvoiceFilters from "../components/InvoiceFilters"
import InvoicesTable from "../components/InvoicesTable"
import { downloadInvoicePdf, getInvoices } from "../services/invoicesApi"
import type { Invoice, InvoiceFiltersValues } from "../types/invoice"

const initialFilters: InvoiceFiltersValues = {
  clientName: "",
  status: "",
  dateFrom: "",
  dateTo: "",
}

const InvoicesListPage = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<InvoiceFiltersValues>(initialFilters)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInvoices()
      setInvoices(data)
    } finally {
      setLoading(false)
    }
  }, [])

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

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

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
      window.alert("PDF de factura descargado.")
    } catch {
      window.alert("No se pudo descargar el PDF de la factura.")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header>
        <h1>Facturas</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Controla facturación y estado de pagos.</p>
      </header>

      <InvoiceFilters values={filters} onChange={setFilters} onApply={handleApplyFilters} onClear={handleClearFilters} />

      {loading ? (
        <p>Cargando facturas...</p>
      ) : filteredInvoices.length === 0 ? (
        <p>No se encontraron facturas.</p>
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          onView={(id) => navigate(`/invoices/${id}`)}
          onDownload={handleDownload}
        />
      )}

      {downloadingId && <p>Descargando factura...</p>}
    </div>
  )
}

export default InvoicesListPage
