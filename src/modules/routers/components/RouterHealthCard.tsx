import type { RouterHealth } from "../types/router"

interface RouterHealthCardProps {
  health: RouterHealth | null
}

const RouterHealthCard = ({ health }: RouterHealthCardProps) => {
  if (!health) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">No hay telemetria disponible para este router.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-3">
      <Metric label="CPU" value={`${health.cpuUsage}%`} />
      <Metric label="RAM" value={`${health.ramUsage}%`} />
      <Metric label="Uptime" value={health.uptime} />
      <Metric label="Interfaces UP" value={String(health.interfacesUp)} />
      <Metric label="Interfaces DOWN" value={String(health.interfacesDown)} />
      <Metric label="Throughput" value={health.throughput} />
    </div>
  )
}

const Metric = ({ label, value }: { label: string; value: string }) => (
  <article className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-base font-semibold text-foreground">{value}</p>
  </article>
)

export default RouterHealthCard

