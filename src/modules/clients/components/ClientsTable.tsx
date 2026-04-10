import DataTableShell from "@/components/shared/DataTableShell"
import type { Client, ClientStatus } from "../types/client"

interface ClientsTableProps {
  clients: Client[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  canManage: boolean
}

const statusClasses: Record<ClientStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-amber-100 text-amber-800",
  inactive: "bg-muted text-muted-foreground",
}

const ClientsTable = ({ clients, onEdit, onDelete, canManage }: ClientsTableProps) => {
  return (
    <DataTableShell>
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Documento</th>
              <th className="px-4 py-3 font-semibold">Teléfono</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">IP</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{client.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.document}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.plan}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.ipAddress}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[client.status]}`}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onEdit(client.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para editar clientes." : undefined}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(client.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para eliminar clientes." : undefined}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </DataTableShell>
  )
}

export default ClientsTable
