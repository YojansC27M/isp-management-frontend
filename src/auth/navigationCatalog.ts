import type { Permission } from "@/auth/types"

export interface NavigationItemDefinition {
  id: string
  label: string
  href: string
  requiredPermissions?: Permission[]
}

export interface NavigationModuleDefinition {
  id: string
  label: string
  href?: string
  requiredPermissions?: Permission[]
  items?: NavigationItemDefinition[]
}

export const NAVIGATION_CATALOG: NavigationModuleDefinition[] = [
  { id: "dashboard", label: "Panel", href: "/dashboard" },
  { id: "internal-users", label: "Usuarios internos", href: "/internal-users", requiredPermissions: ["internal_users.read"] },
  {
    id: "clients",
    label: "Clientes",
    items: [
      { id: "clients-list", label: "Listado de clientes", href: "/clients", requiredPermissions: ["clients.read"] },
      { id: "clients-map", label: "Mapa de clientes", href: "/clients-map", requiredPermissions: ["clients_map.read"] },
    ],
  },
  {
    id: "commercial",
    label: "Comercial",
    items: [
      { id: "plans", label: "Planes", href: "/plans", requiredPermissions: ["plans.read"] },
      { id: "payments", label: "Pagos", href: "/payments", requiredPermissions: ["payments.read"] },
      { id: "invoices", label: "Facturas", href: "/invoices", requiredPermissions: ["invoices.read"] },
    ],
  },
  {
    id: "support",
    label: "Soporte y campo",
    items: [
      { id: "tickets", label: "Tickets", href: "/tickets", requiredPermissions: ["tickets.read"] },
      { id: "visits", label: "Visitas", href: "/visits", requiredPermissions: ["visits.read"] },
    ],
  },
  {
    id: "operations",
    label: "Operacion",
    items: [
      { id: "routers", label: "Routers", href: "/routers", requiredPermissions: ["routers.read"] },
      { id: "monitoring", label: "Monitoreo", href: "/monitoring", requiredPermissions: ["monitoring.read"] },
      { id: "reports", label: "Reportes", href: "/reports", requiredPermissions: ["reports.read"] },
    ],
  },
  {
    id: "security",
    label: "Seguridad",
    items: [
      {
        id: "settings-system",
        label: "Configuracion ISP",
        href: "/settings/system",
        requiredPermissions: ["system_settings.read"],
      },
      { id: "access-control", label: "Perfiles y permisos", href: "/access-control", requiredPermissions: ["roles.read"] },
      { id: "security-audit", label: "Auditoria de seguridad", href: "/security-audit", requiredPermissions: ["audit.read"] },
    ],
  },
]

export const NAVIGATION_ALLOWED_MODULE_IDS = new Set(NAVIGATION_CATALOG.map((module) => module.id))

export const NAVIGATION_ALLOWED_ITEMS_BY_MODULE = new Map(
  NAVIGATION_CATALOG.map((module) => [
    module.id,
    new Set((module.items ?? []).map((item) => item.id)),
  ]),
)
