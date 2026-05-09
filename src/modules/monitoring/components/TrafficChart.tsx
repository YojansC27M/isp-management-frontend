import { useI18n } from "@/i18n/i18nContext"

interface TrafficPoint {
  label: string
  rx: number
  tx: number
  rxLabel?: string
  txLabel?: string
}

interface TrafficChartProps {
  points: TrafficPoint[]
}

const TrafficChart = ({ points }: TrafficChartProps) => {
  const { t } = useI18n()

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("monitoring.traffic.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("monitoring.traffic.subtitle")}</p>
      <div className="mt-4 grid gap-3">
        {points.map((point) => (
          <div key={point.label} className="grid grid-cols-[70px_1fr] items-center gap-3">
            <span className="text-xs text-muted-foreground">{point.label}</span>
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-sky-400" style={{ width: `${point.rx}%` }} />
              </div>
              {point.rxLabel ? <span className="text-[11px] text-muted-foreground">{point.rxLabel}</span> : null}
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${point.tx}%` }} />
              </div>
              {point.txLabel ? <span className="text-[11px] text-muted-foreground">{point.txLabel}</span> : null}
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
