import type { Invoice } from "../types/invoice"

interface InvoiceSummaryCardProps {
  invoice: Invoice
}

const InvoiceSummaryCard = ({ invoice }: InvoiceSummaryCardProps) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Invoice Number</strong>
        <span>{invoice.invoiceNumber}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Client</strong>
        <span>{invoice.clientName}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Amount</strong>
        <span>${invoice.amount.toFixed(2)}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Issue Date</strong>
        <span>{invoice.issueDate}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Due Date</strong>
        <span>{invoice.dueDate}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Status</strong>
        <span style={{ textTransform: "capitalize" }}>{invoice.status}</span>
      </div>
    </div>
  )
}

export default InvoiceSummaryCard
