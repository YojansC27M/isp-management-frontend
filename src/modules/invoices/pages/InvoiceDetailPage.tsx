import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import InvoiceSummaryCard from "../components/InvoiceSummaryCard"
import { downloadInvoicePdf, getInvoiceById } from "../services/invoicesApi"
import type { Invoice } from "../types/invoice"

const InvoiceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getInvoiceById(id)
        setInvoice(data)
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [id])

  const handleDownload = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const blob = await downloadInvoicePdf(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${invoice.invoiceNumber}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <StateMessage variant="loading" title="Cargando factura..." />
  if (!invoice) return <StateMessage variant="empty" title="Factura no encontrada." />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Detalle de factura</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoice.clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/invoices")}>
            Volver a Facturas
          </Button>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? "Descargando..." : "Descargar PDF"}
          </Button>
        </div>
      </header>

      <InvoiceSummaryCard invoice={invoice} />
    </div>
  )
}

export default InvoiceDetailPage
