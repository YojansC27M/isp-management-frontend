import { Laptop, Menu, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/ui/themeContext"

interface AppHeaderProps {
  onOpenSidebar: () => void
}

const AppHeader = ({ onOpenSidebar }: AppHeaderProps) => {
  const { themeMode, cycleThemeMode } = useTheme()

  const themeLabel = themeMode === "system" ? "Sistema" : themeMode === "light" ? "Claro" : "Oscuro"
  const ThemeIcon = themeMode === "system" ? Laptop : themeMode === "light" ? Sun : Moon

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" className="lg:hidden" onClick={onOpenSidebar} aria-label="Abrir menu">
            <Menu />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Consola de red</p>
            <h1 className="text-lg font-semibold text-foreground">Resumen operativo</h1>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-soft-pulse" />
              Sincronizacion activa
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input placeholder="Buscar modulos..." className="w-full bg-background sm:w-56" />
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={cycleThemeMode}
            aria-label={`Cambiar tema. Modo actual: ${themeLabel}`}
            title={`Tema: ${themeLabel}`}
          >
            <ThemeIcon />
          </Button>
          <Button variant="outline" className="shrink-0">
            Ayuda
          </Button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
