import DataTableShell from "@/components/shared/DataTableShell"
import type { InternalUser, InternalUserStatus } from "../types/internalUser"

interface InternalUsersTableProps {
  users: InternalUser[]
  loadByTechnicianId: Record<string, number>
  canManage: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const statusClasses: Record<InternalUserStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-muted text-muted-foreground",
}

const roleLabels: Record<InternalUser["role"], string> = {
  staff: "Staff",
  admin: "Administrador",
  technician: "Tecnico",
  support: "Soporte",
}

const InternalUsersTable = ({ users, loadByTechnicianId, canManage, onEdit, onDelete }: InternalUsersTableProps) => {
  return (
    <DataTableShell>
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Correo</th>
            <th className="px-4 py-3 font-semibold">Telefono</th>
            <th className="px-4 py-3 font-semibold">Rol</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Zonas</th>
            <th className="px-4 py-3 font-semibold">Habilidades</th>
            <th className="px-4 py-3 font-semibold">Carga actual</th>
            <th className="px-4 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const coverage = user.technicianProfile?.coverageZones.join(", ") || "-"
            const skills = user.technicianProfile?.skills.join(", ") || "-"
            return (
              <tr key={user.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{roleLabels[user.role]}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[user.status]}`}>
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground" title={coverage}>
                  {coverage}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground" title={skills}>
                  {skills}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.role === "technician" ? (loadByTechnicianId[user.id] ?? 0) : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onEdit(user.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para editar usuarios internos." : undefined}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(user.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para eliminar usuarios internos." : undefined}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </DataTableShell>
  )
}

export default InternalUsersTable
