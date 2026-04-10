import StateMessage from "@/components/feedback/StateMessage"
import type { ClientPayment } from "../types/clientPortal"

interface ClientPaymentsTableProps {
  payments: ClientPayment[]
}

const ClientPaymentsTable = ({ payments }: ClientPaymentsTableProps) => {
  if (payments.length === 0) {
    return <StateMessage variant="empty" title="No se encontraron pagos." />
  }

  return (
    <section className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Monto</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Metodo</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-t border-border/60 text-muted-foreground">
              <td className="px-4 py-3 font-medium">${payment.amount.toFixed(2)}</td>
              <td className="px-4 py-3">{payment.paymentDate}</td>
              <td className="px-4 py-3 capitalize">{payment.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default ClientPaymentsTable
