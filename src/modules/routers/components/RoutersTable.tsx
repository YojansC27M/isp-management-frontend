import DataTableShell from "@/components/shared/DataTableShell"
import type { ManagedRouter } from "../types/router"

interface RoutersTableProps {
  routers: ManagedRouter[]
  canManage: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onTestConnection: (id: string) => void
}

const statusClasses = {
  online: "bg-emerald-100 text-emerald-700",
  offline: "bg-rose-100 text-rose-700",
}

const RoutersTable = ({ routers, canManage, onView, onEdit, onDelete, onTestConnection }: RoutersTableProps) => {
  return (
    <DataTableShell>
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Router</th>
            <th className="px-4 py-3 font-semibold">IP:Puerto</th>
            <th className="px-4 py-3 font-semibold">Zona</th>
            <th className="px-4 py-3 font-semibold">Ubicacion</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Ultima verificacion</th>
            <th className="px-4 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {routers.map((router) => (
            <tr key={router.id} className="border-t border-border/60">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{router.name}</p>
                <p className="text-xs text-muted-foreground">{router.username}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{`${router.ip}:${router.port}`}</td>
              <td className="px-4 py-3 text-muted-foreground">{router.zone}</td>
              <td className="px-4 py-3 text-muted-foreground">{router.location}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[router.status]}`}>
                  {router.status === "online" ? "Online" : "Offline"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(router.lastCheckedAt).toLocaleString("es-CO")}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                    onClick={() => onView(router.id)}
                  >
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onEdit(router.id)}
                    disabled={!canManage}
                    title={!canManage ? "Tu perfil no tiene permiso para editar routers." : undefined}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-cyan-200 px-2.5 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onTestConnection(router.id)}
                    disabled={!canManage}
                    title={!canManage ? "Tu perfil no tiene permiso para probar conexion." : undefined}
                  >
                    Probar conexion
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => onDelete(router.id)}
                    disabled={!canManage}
                    title={!canManage ? "Tu perfil no tiene permiso para eliminar routers." : undefined}
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

export default RoutersTable
