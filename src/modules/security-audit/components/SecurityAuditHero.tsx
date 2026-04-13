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
          <Button
            variant="outline"
            className="border-white/70 bg-white/90 text-slate-900 shadow-sm hover:bg-white dark:border-white/40 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            onClick={onRefresh}
          >
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="border-white/50 bg-cyan-100/90 text-cyan-950 shadow-sm hover:bg-cyan-100 disabled:border-white/30 disabled:bg-white/40 disabled:text-slate-500 dark:border-cyan-200/35 dark:bg-cyan-200/15 dark:text-cyan-50 dark:hover:bg-cyan-200/25 dark:disabled:border-white/20 dark:disabled:bg-white/10 dark:disabled:text-white/40"
            onClick={onExport}
            disabled={disableExport}
          >
            Exportar JSON
          </Button>
        </div>
      </div>
    </section>
  )
}

export default SecurityAuditHero

