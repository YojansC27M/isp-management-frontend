import { useI18n } from "@/i18n/i18nContext"

const TrafficChart = () => {
  const { t } = useI18n()

  const data = [
    { label: "08:00", rx: 40, tx: 30 },
    { label: "10:00", rx: 55, tx: 45 },
    { label: "12:00", rx: 70, tx: 60 },
    { label: "14:00", rx: 50, tx: 40 },
    { label: "16:00", rx: 65, tx: 52 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("monitoring.traffic.title")}</h3>
      <div className="mt-4 grid gap-3">
        {data.map((point) => (
          <div key={point.label} className="grid grid-cols-[70px_1fr] items-center gap-3">
            <span className="text-xs text-muted-foreground">{point.label}</span>
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: `${point.rx}%` }} />
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${point.tx}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sky-400" />
          RX
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" />
          TX
        </span>
      </div>
    </div>
  )
}

export default TrafficChart
