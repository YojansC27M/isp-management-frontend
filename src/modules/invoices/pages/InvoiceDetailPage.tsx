import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
      window.alert("PDF de factura descargado.")
    } catch {
      window.alert("No se pudo descargar el PDF de la factura.")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <p>Cargando factura...</p>
  }

  if (!invoice) {
    return <p>Factura no encontrada.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Detalle de factura</h1>
        <p style={{ color: "#6b7280" }}>{invoice.clientName}</p>
        <button type="button" onClick={() => navigate("/invoices")} style={{ width: "fit-content" }}>
          Volver a Facturas
        </button>
      </header>

      <InvoiceSummaryCard invoice={invoice} />

      <button type="button" onClick={handleDownload} disabled={downloading} style={{ width: "fit-content" }}>
        {downloading ? "Descargando..." : "Descargar PDF"}
      </button>
    </div>
  )
}

export default InvoiceDetailPage
