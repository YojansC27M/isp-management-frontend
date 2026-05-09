import { useMemo } from "react"
import { useI18n } from "@/i18n/i18nContext"
import { cn } from "@/lib/utils"
import type { ClientProfile } from "../types/clientPortal"

interface ClientSummaryCardProps {
  profile: ClientProfile
}

const statusTone: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  suspended: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  inactive: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
}

const ClientSummaryCard = ({ profile }: ClientSummaryCardProps) => {
  const { t } = useI18n()

  const details = useMemo(
    () => [
      { label: t("clientPortal.summary.client"), value: profile.name },
      { label: t("profile.email"), value: profile.email },
      { label: t("plans.table.name"), value: profile.plan },
      { label: t("clients.table.status"), value: profile.status },
      { label: t("clientPortal.summary.ipAddress"), value: profile.ipAddress },
      { label: t("clientPortal.dashboard.serviceAddress"), value: profile.serviceAddress || t("clientPortal.dashboard.noServiceAddress") },
    ],
    [profile.email, profile.ipAddress, profile.name, profile.plan, profile.serviceAddress, profile.status, t],
  )

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-border/70 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{t("clientPortal.summary.title")}</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{profile.name}</h2>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
              statusTone[profile.status] ?? statusTone.inactive,
            )}
          >
            {t(`clients.status.${profile.status}`)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
        {details.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-border/70 px-5 py-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.balance")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {typeof profile.balance === "number" ? `$${profile.balance.toFixed(2)}` : t("clientPortal.dashboard.balanceUnavailable")}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.nextDue")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {profile.nextDueDate ?? t("clientPortal.dashboard.noDueDate")}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/40 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.dashboard.lastPayment")}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {profile.lastPaymentDate ?? t("clientPortal.dashboard.noLastPayment")}
          </p>
        </div>
      </div>
    </section>
  )
}

export default ClientSummaryCard
