import type { Permission } from "@/auth/types"
import { filterNavItems, type NavItem } from "@/auth/permissions"

export interface AppNavItem extends NavItem {
  label: string
  href: string
}

export const appNavItems: AppNavItem[] = [
  { label: "Panel", href: "/dashboard" },
  { label: "Usuarios internos", href: "/internal-users", requiredPermissions: ["internal_users.read"] },
  { label: "Clientes", href: "/clients", requiredPermissions: ["clients.read"] },
  { label: "Planes", href: "/plans", requiredPermissions: ["plans.read"] },
  { label: "Pagos", href: "/payments", requiredPermissions: ["payments.read"] },
  { label: "Facturas", href: "/invoices", requiredPermissions: ["invoices.read"] },
  { label: "Tickets", href: "/tickets", requiredPermissions: ["tickets.read"] },
  { label: "Visitas", href: "/visits", requiredPermissions: ["visits.read"] },
  { label: "Monitoreo", href: "/monitoring", requiredPermissions: ["monitoring.read"] },
  { label: "Mapa de clientes", href: "/clients-map", requiredPermissions: ["clients_map.read"] },
  { label: "Reportes", href: "/reports", requiredPermissions: ["reports.read"] },
  { label: "Perfiles y permisos", href: "/access-control", requiredPermissions: ["roles.read"] },
  { label: "Auditoria de seguridad", href: "/security-audit", requiredPermissions: ["audit.read"] },
]

export const getFirstAllowedRoute = (permissions: Permission[]) => {
  const visibleItems = filterNavItems(appNavItems, permissions)
  const firstModule = visibleItems.find((item) => (item.requiredPermissions?.length ?? 0) > 0)
  return firstModule?.href ?? "/dashboard"
}
