import DataTableShell from "@/components/shared/DataTableShell"
import { useI18n } from "@/i18n/i18nContext"
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

const InternalUsersTable = ({ users, loadByTechnicianId, canManage, onEdit, onDelete }: InternalUsersTableProps) => {
  const { t } = useI18n()

  const roleLabels: Record<InternalUser["role"], string> = {
    staff: t("internalUsers.role.staff"),
    admin: t("internalUsers.role.admin"),
    technician: t("internalUsers.role.technician"),
    support: t("internalUsers.role.support"),
  }

  return (
    <DataTableShell>
      <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.name")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.email")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.document")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.phone")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.role")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.status")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.zones")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.skills")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.load")}</th>
            <th className="px-4 py-3 font-semibold">{t("internalUsers.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const coverage = user.technicianProfile?.coverageZones.join(", ") || "-"
            const skills = user.technicianProfile?.skills.join(", ") || "-"
            const documentLabel = user.documentNumber ? `${user.documentType} ${user.documentNumber}` : "-"
            return (
              <tr key={user.id} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{documentLabel}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{roleLabels[user.role]}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[user.status]}`}>
                    {t(`internalUsers.status.${user.status}`)}
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
                      title={!canManage ? t("internalUsers.permissionEdit") : undefined}
                    >
                      {t("internalUsers.table.edit")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(user.id)}
                      disabled={!canManage}
                      title={!canManage ? t("internalUsers.permissionDelete") : undefined}
                    >
                      {t("internalUsers.table.delete")}
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
