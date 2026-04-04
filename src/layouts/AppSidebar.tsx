import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Panel", href: "/dashboard" },
  { label: "Clientes", href: "/clients" },
  { label: "Planes", href: "/plans" },
  { label: "Pagos", href: "/payments" },
  { label: "Facturas", href: "/invoices" },
  { label: "Tickets", href: "/tickets" },
  { label: "Visitas", href: "/visits" },
  { label: "Monitoreo", href: "/monitoring" },
  { label: "Mapa de clientes", href: "/clients-map" },
  { label: "Reportes", href: "/reports" },
]

const AppSidebar = () => {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            ISP
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">ISP Management</p>
            <p className="text-sm font-semibold text-slate-900">Operaciones</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-Media text-slate-600 transition",
                isActive && "bg-slate-900 text-white"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-xs text-slate-500">Acceso seguro con monitoreo en tiempo real.</p>
      </div>
    </aside>
  )
}

export default AppSidebar

