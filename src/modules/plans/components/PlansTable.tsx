import DataTableShell from "@/components/shared/DataTableShell"
import type { Plan } from "../types/plan"

interface PlansTableProps {
  plans: Plan[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  canManage: boolean
}

const PlansTable = ({ plans, onEdit, onDelete, canManage }: PlansTableProps) => {
  return (
    <DataTableShell>
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 text-right font-semibold">Descarga</th>
              <th className="px-4 py-3 text-right font-semibold">Subida</th>
              <th className="px-4 py-3 text-right font-semibold">Precio</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{plan.name}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{plan.downloadSpeed} Mbps</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{plan.uploadSpeed} Mbps</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">${plan.price.toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{plan.type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onEdit(plan.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para editar planes." : undefined}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(plan.id)}
                      disabled={!canManage}
                      title={!canManage ? "Tu perfil no tiene permiso para eliminar planes." : undefined}
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

export default PlansTable
