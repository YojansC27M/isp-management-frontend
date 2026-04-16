import { useI18n } from "@/i18n/i18nContext"
import type { ClientProfile } from "../types/clientPortal"

interface ClientSummaryCardProps {
  profile: ClientProfile
}

const ClientSummaryCard = ({ profile }: ClientSummaryCardProps) => {
  const { t } = useI18n()

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("clientPortal.summary.title")}</h2>
      <dl className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientPortal.summary.client")}</dt>
          <dd>{profile.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("profile.email")}</dt>
          <dd>{profile.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("plans.table.name")}</dt>
          <dd>{profile.plan}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clients.table.status")}</dt>
          <dd className="capitalize">{profile.status}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("clientPortal.summary.ipAddress")}</dt>
          <dd>{profile.ipAddress}</dd>
        </div>
      </dl>
    </section>
  )
}

export default ClientSummaryCard
