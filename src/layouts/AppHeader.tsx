import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const AppHeader = () => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Consola de red</p>
        <h1 className="text-lg font-semibold text-slate-900">Resumen operativo</h1>
      </div>
      <div className="flex items-center gap-3">
        <Input placeholder="Buscar módulos..." className="w-56" />
        <Button variant="outline">Ayuda</Button>
      </div>
    </header>
  )
}

export default AppHeader

