import { useI18n } from "@/i18n/i18nContext"
import KeyValueSummaryGrid, { type KeyValueSummaryItem } from "@/components/shared/KeyValueSummaryGrid"
import type { Invoice } from "../types/invoice"

interface InvoiceSummaryCardProps {
  invoice: Invoice
}

const InvoiceSummaryCard = ({ invoice }: InvoiceSummaryCardProps) => {
  const { t } = useI18n()

  const items: KeyValueSummaryItem[] = [
    { label: t("invoices.detail.number"), value: invoice.invoiceNumber, valueClassName: "capitalize" },
    { label: t("invoices.table.client"), value: invoice.clientName, valueClassName: "capitalize" },
    { label: t("invoices.table.amount"), value: `$${invoice.amount.toFixed(2)}`, valueClassName: "capitalize" },
    { label: t("invoices.detail.issueDate"), value: invoice.issueDate, valueClassName: "capitalize" },
    { label: t("invoices.detail.dueDate"), value: invoice.dueDate, valueClassName: "capitalize" },
    { label: t("invoices.table.status"), value: invoice.status, valueClassName: "capitalize" },
  ]

  return <KeyValueSummaryGrid items={items} />
}

export default InvoiceSummaryCard
