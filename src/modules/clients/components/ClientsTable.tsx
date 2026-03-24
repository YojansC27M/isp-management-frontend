import type { Client } from "../types/client"

interface ClientsTableProps {
  clients: Client[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const ClientsTable = ({ clients, onEdit, onDelete }: ClientsTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Name</th>
            <th>Document</th>
            <th>Phone</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{client.name}</td>
              <td>{client.document}</td>
              <td>{client.phone}</td>
              <td>{client.plan}</td>
              <td>{client.status}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onEdit(client.id)}>
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(client.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ClientsTable
