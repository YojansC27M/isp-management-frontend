import { useI18n } from "@/i18n/i18nContext"
import type { RevenueData } from "../types/report"

interface RevenueChartProps {
  data: RevenueData[]
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const { t } = useI18n()

  if (data.length === 0) return <p className="text-sm text-muted-foreground">{t("reports.revenue.empty")}</p>

  const maxAmount = Math.max(...data.map((point) => point.amount), 1)

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("reports.revenue.title")}</h3>
      <div className="mt-3 grid gap-2.5">
        {data.map((point) => (
          <div key={point.date} className="grid grid-cols-[80px_1fr] items-center gap-3">
            <span className="text-xs text-muted-foreground">{point.date}</span>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(point.amount / maxAmount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default RevenueChart
