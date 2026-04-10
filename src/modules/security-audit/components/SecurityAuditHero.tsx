import { Button } from "@/components/ui/button"

interface SecurityAuditHeroProps {
  onRefresh: () => void
  onExport: () => void
  disableExport: boolean
}

const SecurityAuditHero = ({ onRefresh, onExport, disableExport }: SecurityAuditHeroProps) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(120deg,#111827,#1d4ed8_52%,#0d9488)] p-6 text-white">
      <div className="pointer-events-none absolute -right-12 -top-10 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Gobierno y cumplimiento</p>
          <h1 className="mt-2 text-2xl font-semibold">Auditoria de seguridad</h1>
          <p className="mt-1 text-sm text-slate-100/90">
            Monitorea cambios en perfiles y permisos con trazabilidad completa para control operativo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={onRefresh}>
            Actualizar
          </Button>
          <Button className="bg-card text-foreground hover:bg-muted" onClick={onExport} disabled={disableExport}>
            Exportar JSON
          </Button>
        </div>
      </div>
    </section>
  )
}

export default SecurityAuditHero

