import { useI18n } from "@/i18n/i18nContext"
import type { InterfaceStatus, InterfaceStatusType } from "../types/monitoring"

interface InterfacesTableProps {
  interfaces: InterfaceStatus[]
}

const statusClasses: Record<InterfaceStatusType, string> = {
  up: "bg-emerald-100 text-emerald-800",
  down: "bg-rose-100 text-rose-800",
}

const InterfacesTable = ({ interfaces }: InterfacesTableProps) => {
  const { t } = useI18n()

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("monitoring.interfaces.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("monitoring.interfaces.status")}</th>
              <th className="px-4 py-3 font-semibold">RX</th>
              <th className="px-4 py-3 font-semibold">TX</th>
            </tr>
          </thead>
          <tbody>
            {interfaces.map((item) => (
              <tr key={item.name} className="border-t border-border/60">
                <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.rx}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.tx}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InterfacesTable
