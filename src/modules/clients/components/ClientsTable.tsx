import type { CSSProperties } from "react"
import type { Client, ClientStatus } from "../types/client"

interface ClientsTableProps {
  clients: Client[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const badgeStyles: Record<ClientStatus, CSSProperties> = {
  active: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  suspended: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  inactive: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
}

const ClientsTable = ({ clients, onEdit, onDelete }: ClientsTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Nombre</th>
            <th>Documento</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Plan</th>
            <th>Dirección IP</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{client.name}</td>
              <td>{client.document}</td>
              <td>{client.phone}</td>
              <td>{client.email}</td>
              <td>{client.plan}</td>
              <td>{client.ipAddress}</td>
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
                    ...badgeStyles[client.status],
                  }}
                >
                  {client.status}
                </span>
              </td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onEdit(client.id)}>
                  Editar
                </button>
                <button type="button" onClick={() => onDelete(client.id)}>
                  Eliminar
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
