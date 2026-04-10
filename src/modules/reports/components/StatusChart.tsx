import type { StatusDistribution } from "../types/report"

interface StatusChartProps {
  data: StatusDistribution[]
}

const StatusChart = ({ data }: StatusChartProps) => {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No hay distribución de estados.</p>

  const maxCount = Math.max(...data.map((item) => item.count), 1)

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Distribución de estados</h3>
      <div className="mt-3 grid gap-2.5">
        {data.map((item) => (
          <div key={item.status} className="grid grid-cols-[100px_1fr] items-center gap-3">
            <span className="text-xs capitalize text-muted-foreground">{item.status}</span>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(item.count / maxCount) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatusChart
