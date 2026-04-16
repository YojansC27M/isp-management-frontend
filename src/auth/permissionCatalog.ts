import type { Permission } from "@/auth/types"

export interface PermissionDefinition {
  permission: Permission
  module: string
  action: "read" | "write"
  label: string
  description: string
}

export const permissionCatalog: PermissionDefinition[] = [
  {
    permission: "system_settings.read",
    module: "Configuracion ISP",
    action: "read",
    label: "Ver configuracion del sistema",
    description: "Puede consultar los parametros globales de la plataforma ISP.",
  },
  {
    permission: "system_settings.write",
    module: "Configuracion ISP",
    action: "write",
    label: "Gestionar configuracion del sistema",
    description: "Puede editar informacion de empresa, facturacion, zona horaria y logo.",
  },
  {
    permission: "routers.read",
    module: "Routers",
    action: "read",
    label: "Ver routers",
    description: "Puede consultar inventario y estado de routers.",
  },
  {
    permission: "routers.write",
    module: "Routers",
    action: "write",
    label: "Gestionar routers",
    description: "Puede crear, editar, eliminar y probar conexion de routers.",
  },
  {
    permission: "internal_users.read",
    module: "Usuarios internos",
    action: "read",
    label: "Ver usuarios internos",
    description: "Puede consultar el listado y el perfil de usuarios internos.",
  },
  {
    permission: "internal_users.write",
    module: "Usuarios internos",
    action: "write",
    label: "Gestionar usuarios internos",
    description: "Puede crear, editar y eliminar usuarios internos.",
  },
  {
    permission: "clients.read",
    module: "Clientes",
    action: "read",
    label: "Ver clientes",
    description: "Puede abrir el listado y consultar la informacion de clientes.",
  },
  {
    permission: "clients.write",
    module: "Clientes",
    action: "write",
    label: "Gestionar clientes",
    description: "Puede crear, editar, eliminar e importar clientes.",
  },
  {
    permission: "plans.read",
    module: "Planes",
    action: "read",
    label: "Ver planes",
    description: "Puede consultar el catalogo de planes.",
  },
  {
    permission: "plans.write",
    module: "Planes",
    action: "write",
    label: "Gestionar planes",
    description: "Puede crear, editar y eliminar planes.",
  },
  {
    permission: "payments.read",
    module: "Pagos",
    action: "read",
    label: "Ver pagos",
    description: "Puede consultar pagos y estado de cuenta.",
  },
  {
    permission: "payments.write",
    module: "Pagos",
    action: "write",
    label: "Registrar pagos",
    description: "Puede registrar pagos manuales.",
  },
  {
    permission: "invoices.read",
    module: "Facturas",
    action: "read",
    label: "Ver facturas",
    description: "Puede consultar facturas y descargar PDF.",
  },
  {
    permission: "invoices.write",
    module: "Facturas",
    action: "write",
    label: "Configurar facturacion",
    description: "Puede modificar automatizacion y numeracion de facturas.",
  },
  {
    permission: "tickets.read",
    module: "Tickets",
    action: "read",
    label: "Ver tickets",
    description: "Puede abrir tickets e historial.",
  },
  {
    permission: "tickets.write",
    module: "Tickets",
    action: "write",
    label: "Gestionar tickets",
    description: "Puede crear tickets, editar y comentar.",
  },
  {
    permission: "visits.read",
    module: "Visitas",
    action: "read",
    label: "Ver visitas",
    description: "Puede consultar agenda y detalle de visitas tecnicas.",
  },
  {
    permission: "visits.write",
    module: "Visitas",
    action: "write",
    label: "Gestionar visitas",
    description: "Puede programar y actualizar visitas.",
  },
  {
    permission: "monitoring.read",
    module: "Monitoreo",
    action: "read",
    label: "Ver monitoreo",
    description: "Puede acceder al panel tecnico de monitoreo.",
  },
  {
    permission: "reports.read",
    module: "Reportes",
    action: "read",
    label: "Ver reportes",
    description: "Puede consultar indicadores y reportes financieros.",
  },
  {
    permission: "clients_map.read",
    module: "Mapa",
    action: "read",
    label: "Ver mapa de clientes",
    description: "Puede navegar el mapa y ver ubicacion de clientes.",
  },
  {
    permission: "roles.read",
    module: "Perfiles y permisos",
    action: "read",
    label: "Ver perfiles y permisos",
    description: "Puede consultar configuracion de perfiles.",
  },
  {
    permission: "roles.write",
    module: "Perfiles y permisos",
    action: "write",
    label: "Editar perfiles y permisos",
    description: "Puede modificar permisos por perfil.",
  },
  {
    permission: "audit.read",
    module: "Auditoria",
    action: "read",
    label: "Ver auditoria de seguridad",
    description: "Puede consultar historial de cambios de permisos y perfiles.",
  },
  {
    permission: "client_portal.read",
    module: "Portal de cliente",
    action: "read",
    label: "Ver portal de cliente",
    description: "Puede consultar informacion en el portal de cliente.",
  },
  {
    permission: "client_portal.write",
    module: "Portal de cliente",
    action: "write",
    label: "Gestionar portal de cliente",
    description: "Puede ejecutar acciones dentro del portal de cliente.",
  },
]

const permissionMap = new Map(permissionCatalog.map((item) => [item.permission, item]))

export const getPermissionDefinition = (permission: Permission) => {
  return permissionMap.get(permission) ?? null
}
