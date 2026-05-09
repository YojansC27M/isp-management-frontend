export interface NavigationItemDefinition {
  id: string
  label: string
  href?: string
  requiredPermissions?: string[]
  items?: NavigationItemDefinition[]
}

export interface NavigationModuleDefinition {
  id: string
  label: string
  href?: string
  requiredPermissions?: string[]
  items?: NavigationItemDefinition[]
}

export const NAVIGATION_CATALOG: NavigationModuleDefinition[] = [
  { id: "dashboard", label: "Panel", href: "/dashboard", requiredPermissions: ["dashboard.read"] },
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
      { id: "support-overview", label: "Resumen de soporte", href: "/support/overview", requiredPermissions: ["tickets.read"] },
      { id: "tickets", label: "Tickets", href: "/tickets", requiredPermissions: ["tickets.read"] },
      { id: "visits", label: "Visitas", href: "/visits", requiredPermissions: ["visits.read"] },
      { id: "installations", label: "Instalaciones", href: "/installations", requiredPermissions: ["visits.read"] },
    ],
  },
  {
    id: "operations",
    label: "Operacion",
    items: [
      {
        id: "noc",
        label: "NOC",
        requiredPermissions: ["routers.read", "monitoring.read"],
        items: [
          { id: "noc-routers", label: "Routers", href: "/routers", requiredPermissions: ["routers.read"] },
          { id: "noc-monitoring", label: "Monitoreo", href: "/monitoring", requiredPermissions: ["monitoring.read"] },
        ],
      },
      { id: "reports", label: "Reportes", href: "/reports", requiredPermissions: ["reports.read"] },
    ],
  },
  {
    id: "security",
    label: "Seguridad",
    items: [
      { id: "settings-system", label: "Configuracion ISP", href: "/settings/system", requiredPermissions: ["system_settings.read"] },
      { id: "access-control", label: "Perfiles y permisos", href: "/access-control", requiredPermissions: ["roles.read"] },
      { id: "security-audit", label: "Auditoria de seguridad", href: "/security-audit", requiredPermissions: ["audit.read"] },
    ],
  },
]

export const defaultPermissionsByRole: Record<string, string[]> = {
  super_admin: [
    "dashboard.read",
    "clients.read",
    "clients.write",
    "clients_map.read",
    "plans.read",
    "plans.write",
    "internal_users.read",
    "internal_users.write",
    "payments.read",
    "payments.manual.write",
    "invoices.read",
    "invoices.write",
    "tickets.read",
    "tickets.write",
    "visits.read",
    "visits.write",
    "routers.read",
    "routers.write",
    "monitoring.read",
    "reports.read",
    "roles.read",
    "roles.write",
    "system_settings.read",
    "system_settings.write",
    "document_types.read",
    "document_types.write",
    "audit.read",
  ],
  admin: [
    "dashboard.read",
    "clients.read",
    "clients.write",
    "clients_map.read",
    "plans.read",
    "plans.write",
    "internal_users.read",
    "internal_users.write",
    "payments.read",
    "payments.manual.write",
    "invoices.read",
    "invoices.write",
    "tickets.read",
    "tickets.write",
    "visits.read",
    "visits.write",
    "routers.read",
    "routers.write",
    "monitoring.read",
    "reports.read",
    "roles.read",
    "system_settings.read",
    "system_settings.write",
    "document_types.read",
    "document_types.write",
    "audit.read",
  ],
  staff: [
    "dashboard.read",
    "clients.read",
    "clients.write",
    "clients_map.read",
    "plans.read",
    "internal_users.read",
    "internal_users.write",
    "payments.read",
    "invoices.read",
    "tickets.read",
    "tickets.write",
    "visits.read",
    "reports.read",
    "roles.read",
    "document_types.read",
    "audit.read",
  ],
  technician: ["dashboard.read", "tickets.read", "tickets.write", "visits.read", "visits.write", "routers.read", "routers.write", "monitoring.read"],
  support: [
    "dashboard.read",
    "internal_users.read",
    "clients.read",
    "tickets.read",
    "tickets.write",
    "visits.read",
    "payments.read",
    "invoices.read",
    "document_types.read",
  ],
  client: [],
}

export const getNavigationForPermissions = (permissions: string[]) => {
  const filterItems = (items: NavigationItemDefinition[]): string[] => {
    const result: string[] = []
    for (const item of items) {
      const hasPermission = !item.requiredPermissions || item.requiredPermissions.some((permission) => permissions.includes(permission))
      if (!hasPermission) continue

      const nested = item.items ? filterItems(item.items) : []
      if (nested.length > 0) {
        result.push(item.id, ...nested)
        continue
      }

      if (item.href) {
        result.push(item.id)
      }
    }
    return result
  }

  return NAVIGATION_CATALOG.map((module) => {
    if (module.href && (!module.requiredPermissions || module.requiredPermissions.some((permission) => permissions.includes(permission)))) {
      return { id: module.id, items: [] }
    }

    const items = filterItems(module.items ?? [])

    return { id: module.id, items }
  }).filter((module) => module.items.length > 0 || NAVIGATION_CATALOG.find((candidate) => candidate.id === module.id)?.href)
}
