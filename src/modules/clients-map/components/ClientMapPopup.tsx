import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useCan } from "@/auth/usePermission"
import { useI18n } from "@/i18n/i18nContext"
import type { ClientMapItem } from "../types/clientMap"

interface ClientMapPopupProps {
  client: ClientMapItem
}

const ClientMapPopup = ({ client }: ClientMapPopupProps) => {
  const navigate = useNavigate()
  const canManageClients = useCan("clients.write")
  const { t } = useI18n()

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{client.name}</h3>
          <p className="text-sm text-muted-foreground">{client.document}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/clients/${client.id}/edit`)}
          disabled={!canManageClients}
          title={!canManageClients ? t("clientsMap.popup.permissionEdit") : undefined}
        >
          {t("clientsMap.popup.viewClient")}
        </Button>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientsMap.popup.phone")}</dt>
          <dd>{client.phone}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientsMap.popup.plan")}</dt>
          <dd>{client.plan}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientsMap.popup.status")}</dt>
          <dd className="capitalize">{t(`clients.status.${client.status}`)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientsMap.popup.zone")}</dt>
          <dd>{client.zone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientsMap.popup.assignedTechnician")}</dt>
          <dd>{client.technicianName}</dd>
        </div>
      </dl>
    </section>
  )
}

export default ClientMapPopup
