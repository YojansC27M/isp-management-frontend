import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  { label: "Clientes activos", value: "2,458" },
  { label: "Tickets abiertos", value: "37" },
  { label: "Instalaciones hoy", value: "14" },
  { label: "Latencia promedio", value: "18 ms" },
]

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">ISP Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vista general de operaciones, soporte y rendimiento en tiempo real.
        </p>
      </div>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aqui puedes integrar notificaciones, tickets recientes y estado de la red.
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
