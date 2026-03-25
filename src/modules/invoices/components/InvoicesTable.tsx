import type { CSSProperties } from "react"
import type { Invoice, InvoiceStatus } from "../types/invoice"

interface InvoicesTableProps {
  invoices: Invoice[]
  onView: (id: string) => void
  onDownload: (invoice: Invoice) => void
}

const statusStyles: Record<InvoiceStatus, CSSProperties> = {
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  paid: { backgroundColor: "#dcfce7", color: "#166534" },
  overdue: { backgroundColor: "#fee2e2", color: "#991b1b" },
}

const InvoicesTable = ({ invoices, onView, onDownload }: InvoicesTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Invoice Number</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.clientName}</td>
              <td>${invoice.amount.toFixed(2)}</td>
              <td>{invoice.issueDate}</td>
              <td>{invoice.dueDate}</td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    ...statusStyles[invoice.status],
                  }}
                >
                  {invoice.status}
                </span>
              </td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onView(invoice.id)}>
                  View
                </button>
                <button type="button" onClick={() => onDownload(invoice)}>
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InvoicesTable
