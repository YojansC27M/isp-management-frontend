import { useI18n } from "@/i18n/i18nContext"
import KeyValueSummaryGrid, { type KeyValueSummaryItem } from "@/components/shared/KeyValueSummaryGrid"
import type { Invoice } from "../types/invoice"
import { formatInvoiceAmount, formatInvoiceDate, invoiceStatusTone } from "../lib/invoicePresentation"

interface InvoiceSummaryCardProps {
  invoice: Invoice
  formatAmount?: (value: number) => string
  formatDate?: (value: string) => string
}

const InvoiceSummaryCard = ({ invoice, formatAmount, formatDate }: InvoiceSummaryCardProps) => {
  const { t } = useI18n()
  const renderAmount = formatAmount ?? ((value: number) => formatInvoiceAmount(value))
  const renderDate = formatDate ?? ((value: string) => formatInvoiceDate(value))

  const items: KeyValueSummaryItem[] = [
    { label: t("invoices.detail.number"), value: invoice.invoiceNumber, valueClassName: "font-medium" },
    { label: t("invoices.table.client"), value: invoice.clientName },
    { label: t("invoices.table.amount"), value: renderAmount(invoice.amount), valueClassName: "font-semibold" },
    { label: t("invoices.detail.issueDate"), value: renderDate(invoice.issueDate) },
    { label: t("invoices.detail.dueDate"), value: renderDate(invoice.dueDate) },
    {
      label: t("invoices.table.status"),
      value: <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${invoiceStatusTone[invoice.status]}`}>{t(`invoices.status.${invoice.status}`)}</span>,
    },
  ]

  return <KeyValueSummaryGrid items={items} />
}

export default InvoiceSummaryCard
