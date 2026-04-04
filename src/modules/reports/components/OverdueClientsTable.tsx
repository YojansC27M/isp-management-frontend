import type { OverdueClient } from "../types/report"

interface OverdueClientsTableProps {
  clients: OverdueClient[]
}

const OverdueClientsTable = ({ clients }: OverdueClientsTableProps) => {
  if (clients.length === 0) {
    return <p>No se encontraron clientes vencidos.</p>
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Cliente</th>
            <th>Monto vencido</th>
            <th>Días en mora</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{client.name}</td>
              <td>${client.amountDue.toFixed(2)}</td>
              <td>{client.daysOverdue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OverdueClientsTable
