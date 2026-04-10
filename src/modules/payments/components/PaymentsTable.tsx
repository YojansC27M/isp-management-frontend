import DataTableShell from "@/components/shared/DataTableShell"
import type { Payment, PaymentStatus } from "../types/payment"

interface PaymentsTableProps {
  payments: Payment[]
  onViewStatus: (clientId: string, clientName: string) => void
}

const statusClasses: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
}

const PaymentsTable = ({ payments, onViewStatus }: PaymentsTableProps) => {
  return (
    <DataTableShell>
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Factura</th>
              <th className="px-4 py-3 font-semibold">Monto</th>
              <th className="px-4 py-3 font-semibold">Método</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{payment.clientName}</td>
                <td className="px-4 py-3 text-muted-foreground">{payment.invoiceNumber}</td>
                <td className="px-4 py-3 font-semibold text-foreground">${payment.amount.toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{payment.paymentMethod}</td>
                <td className="px-4 py-3 text-muted-foreground">{payment.paymentDate}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[payment.status]}`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onViewStatus(payment.clientId, payment.clientName)}
                  >
                    Ver estado de cuenta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </DataTableShell>
  )
}

export default PaymentsTable
