import type { CSSProperties } from "react"
import type { Payment, PaymentStatus } from "../types/payment"

interface PaymentsTableProps {
  payments: Payment[]
  onViewStatus: (clientId: string, clientName: string) => void
}

const badgeStyles: Record<PaymentStatus, CSSProperties> = {
  pending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  paid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  overdue: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
}

const PaymentsTable = ({ payments, onViewStatus }: PaymentsTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Cliente</th>
            <th>Número de factura</th>
            <th>Monto</th>
            <th>Método de pago</th>
            <th>Fecha de pago</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{payment.clientName}</td>
              <td>{payment.invoiceNumber}</td>
              <td>${payment.amount.toFixed(2)}</td>
              <td style={{ textTransform: "capitalize" }}>{payment.paymentMethod}</td>
              <td>{payment.paymentDate}</td>
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
                    ...badgeStyles[payment.status],
                  }}
                >
                  {payment.status}
                </span>
              </td>
              <td>
                <button type="button" onClick={() => onViewStatus(payment.clientId, payment.clientName)}>
                  Ver estado de cuenta
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PaymentsTable
