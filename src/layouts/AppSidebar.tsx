import { X } from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { filterNavItems, getUserPermissions } from "@/auth/permissions"
import { appNavItems } from "@/auth/navigation"

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)
  const visibleItems = filterNavItems(appNavItems, effectivePermissions)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card/95 text-foreground backdrop-blur transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="Navegacion principal"
    >
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            ISP
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ISP Management</p>
            <p className="text-sm font-semibold text-foreground">Operaciones</p>
          </div>
        </div>
        <Button variant="outline" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label="Cerrar menu">
          <X />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                isActive &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">Acceso seguro con monitoreo en tiempo real.</p>
      </div>
    </aside>
  )
}

export default AppSidebar
