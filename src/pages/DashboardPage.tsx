import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, AlertTriangle, ArrowUpRight, CalendarClock, Signal, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  { label: "Clientes activos", value: "2,458", trend: "+4.2%", icon: Users, positive: true },
  { label: "Tickets abiertos", value: "37", trend: "-8.5%", icon: AlertTriangle, positive: true },
  { label: "Visitas hoy", value: "14", trend: "+2.1%", icon: CalendarClock, positive: true },
  { label: "Latencia promedio", value: "18 ms", trend: "-1.4 ms", icon: Signal, positive: true },
]

const incidents = [
  { title: "Router North POP", detail: "Consumo de RAM sobre 86%", severity: "Alta" },
  { title: "Ticket #1021", detail: "Intermitencia en sector Centro", severity: "Media" },
  { title: "Cobro vencido", detail: "42 cuentas por vencer en 3 dias", severity: "Baja" },
]

const severityTone = {
  Alta: "bg-rose-100 text-rose-700",
  Media: "bg-amber-100 text-amber-700",
  Baja: "bg-emerald-100 text-emerald-700",
} as const

const DashboardPage = () => {
  const navigate = useNavigate()

  const currentDateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date())
  }, [])

  return (
    <div className="space-y-6">
      <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(115deg,#0b132b,#163a63_45%,#0f766e)] p-6 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.8)]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-emerald-300/20 blur-2xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">Centro de operaciones</p>
            <h1 className="mt-3 text-3xl font-semibold">Panel de control ISP</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-100/90">
              Monitorea red, soporte y facturacion desde una sola consola, con foco en decisiones rapidas.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button className="bg-card text-foreground hover:bg-muted" onClick={() => navigate("/monitoring")}>
                Ir a monitoreo
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-card/10" onClick={() => navigate("/tickets")}>
                Revisar tickets
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-white/20 bg-card/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-cyan-100">Estado de la operacion</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-soft-pulse" />
                En linea
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-100/80 capitalize">{currentDateLabel}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">Routers</p>
                <p className="text-lg font-semibold">12</p>
              </div>
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">Up Time</p>
                <p className="text-lg font-semibold">99.8%</p>
              </div>
              <div className="rounded-lg bg-card/10 p-2">
                <p className="text-xs text-cyan-100/90">Alertas</p>
                <p className="text-lg font-semibold">3</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up-delay-1 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-border bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                  <span className="rounded-lg bg-sky-100 p-1.5 text-sky-700">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-semibold text-foreground">{metric.value}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      metric.positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {metric.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="animate-fade-up-delay-2 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-border bg-card">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Actividad de red por hora</CardTitle>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Ultimos picos
            </span>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { label: "08:00", value: 48 },
                { label: "10:00", value: 62 },
                { label: "12:00", value: 78 },
                { label: "14:00", value: 58 },
                { label: "16:00", value: 71 },
              ].map((point) => (
                <div key={point.label} className="grid grid-cols-[65px_1fr_38px] items-center gap-3">
                  <span className="text-xs text-muted-foreground">{point.label}</span>
                  <div className="h-2.5 rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${point.value}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">{point.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Alertas y pendientes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {incidents.map((incident) => (
              <article
                key={incident.title}
                className="rounded-lg border border-border bg-muted/40 p-3 transition hover:border-border hover:bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{incident.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityTone[incident.severity as keyof typeof severityTone]}`}>
                    {incident.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{incident.detail}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
