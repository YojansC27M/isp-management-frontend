import KeyValueSummaryGrid, { type KeyValueSummaryItem } from "@/components/shared/KeyValueSummaryGrid"
import type { Invoice } from "../types/invoice"

interface InvoiceSummaryCardProps {
  invoice: Invoice
}

const InvoiceSummaryCard = ({ invoice }: InvoiceSummaryCardProps) => {
  const items: KeyValueSummaryItem[] = [
    { label: "Numero de factura", value: invoice.invoiceNumber, valueClassName: "capitalize" },
    { label: "Cliente", value: invoice.clientName, valueClassName: "capitalize" },
    { label: "Monto", value: `$${invoice.amount.toFixed(2)}`, valueClassName: "capitalize" },
    { label: "Fecha de emision", value: invoice.issueDate, valueClassName: "capitalize" },
    { label: "Fecha de vencimiento", value: invoice.dueDate, valueClassName: "capitalize" },
    { label: "Estado", value: invoice.status, valueClassName: "capitalize" },
  ]

  return <KeyValueSummaryGrid items={items} />
}

export default InvoiceSummaryCard
