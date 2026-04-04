import type { ClientPayment } from "../types/clientPortal"

interface ClientPaymentsTableProps {
  payments: ClientPayment[]
}

const ClientPaymentsTable = ({ payments }: ClientPaymentsTableProps) => {
  if (payments.length === 0) {
    return <p>No se encontraron pagos.</p>
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Monto</th>
            <th>Fecha</th>
            <th>Método</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>${payment.amount.toFixed(2)}</td>
              <td>{payment.paymentDate}</td>
              <td style={{ textTransform: "capitalize" }}>{payment.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ClientPaymentsTable
