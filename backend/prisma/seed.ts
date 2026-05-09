import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"

const prisma = new PrismaClient()

const roles = [
  { key: "super_admin", name: "Super Admin", description: "Acceso total al sistema", isSystem: true },
  { key: "admin", name: "Admin", description: "Administracion operativa general", isSystem: true },
  { key: "staff", name: "Staff", description: "Operacion general de plataforma", isSystem: true },
  { key: "technician", name: "Tecnico", description: "Operacion de campo y routers", isSystem: true },
  { key: "support", name: "Soporte", description: "Atencion de tickets y visitas", isSystem: true },
  { key: "client", name: "Cliente", description: "Acceso al portal de cliente", isSystem: true },
]

const permissions = [
  { key: "dashboard.read", module: "Dashboard", label: "Ver dashboard", description: "Puede ver el panel principal." },
  { key: "clients.read", module: "Clientes", label: "Ver clientes", description: "Puede consultar clientes." },
  { key: "clients.write", module: "Clientes", label: "Gestionar clientes", description: "Puede crear y editar clientes." },
  { key: "clients_map.read", module: "Clientes", label: "Ver mapa de clientes", description: "Puede consultar el mapa de clientes." },
  { key: "plans.read", module: "Planes", label: "Ver planes", description: "Puede consultar planes." },
  { key: "plans.write", module: "Planes", label: "Gestionar planes", description: "Puede crear y editar planes." },
  { key: "payments.read", module: "Pagos", label: "Ver pagos", description: "Puede consultar pagos." },
  { key: "payments.manual.write", module: "Pagos", label: "Registrar pagos manuales", description: "Puede registrar, editar y eliminar pagos manuales de contingencia." },
  { key: "invoices.read", module: "Facturacion", label: "Ver facturas", description: "Puede consultar facturas." },
  { key: "invoices.write", module: "Facturacion", label: "Gestionar facturas", description: "Puede generar y enviar facturas." },
  { key: "tickets.read", module: "Tickets", label: "Ver tickets", description: "Puede consultar tickets." },
  { key: "tickets.write", module: "Tickets", label: "Gestionar tickets", description: "Puede crear y actualizar tickets." },
  { key: "visits.read", module: "Visitas", label: "Ver visitas", description: "Puede consultar visitas." },
  { key: "visits.write", module: "Visitas", label: "Gestionar visitas", description: "Puede crear y actualizar visitas." },
  { key: "routers.read", module: "Routers", label: "Ver routers", description: "Puede consultar routers." },
  { key: "routers.write", module: "Routers", label: "Gestionar routers", description: "Puede crear y editar routers." },
  { key: "internal_users.read", module: "Usuarios internos", label: "Ver usuarios internos", description: "Puede consultar usuarios internos." },
  { key: "internal_users.write", module: "Usuarios internos", label: "Gestionar usuarios internos", description: "Puede crear, editar y eliminar usuarios internos." },
  { key: "monitoring.read", module: "Monitoreo", label: "Ver monitoreo", description: "Puede consultar salud tecnica." },
  { key: "reports.read", module: "Reportes", label: "Ver reportes", description: "Puede consultar reportes." },
  { key: "roles.read", module: "Seguridad", label: "Ver roles", description: "Puede consultar perfiles." },
  { key: "roles.write", module: "Seguridad", label: "Gestionar roles", description: "Puede editar permisos por rol." },
  { key: "system_settings.read", module: "Configuracion ISP", label: "Ver configuracion", description: "Puede consultar la configuracion del sistema." },
  { key: "system_settings.write", module: "Configuracion ISP", label: "Gestionar configuracion", description: "Puede editar la configuracion del sistema." },
  { key: "document_types.read", module: "Configuracion ISP", label: "Ver tipos de documento", description: "Puede consultar el catalogo de tipos de documento." },
  { key: "document_types.write", module: "Configuracion ISP", label: "Gestionar tipos de documento", description: "Puede crear, editar y desactivar tipos de documento." },
  { key: "audit.read", module: "Seguridad", label: "Ver auditoria", description: "Puede consultar auditoria de seguridad." },
]

const systemDocumentTypes = [
  { code: "CC", name: "Cedula de ciudadania", active: true, isSystem: true },
  { code: "CE", name: "Cedula de extranjeria", active: true, isSystem: true },
  { code: "TI", name: "Tarjeta de identidad", active: true, isSystem: true },
  { code: "NIT", name: "Numero de identificacion tributaria", active: true, isSystem: true },
  { code: "PASSPORT", name: "Pasaporte", active: true, isSystem: true },
]

async function main() {
  const createdRoles = await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { key: role.key },
        update: role,
        create: role,
      }),
    ),
  )

  const createdPermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: { key: permission.key },
        update: permission,
        create: permission,
      }),
    ),
  )

  const systemRole = createdRoles.find((role) => role.key === "super_admin")
  if (systemRole) {
    await Promise.all(
      createdPermissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: systemRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: systemRole.id,
            permissionId: permission.id,
          },
        }),
      ),
    )
  }

  const adminEmail = process.env["BOOTSTRAP_ADMIN_EMAIL"]?.trim()
  const adminPassword = process.env["BOOTSTRAP_ADMIN_PASSWORD"]?.trim()
  const adminName = process.env["BOOTSTRAP_ADMIN_NAME"]?.trim() ?? "System Admin"

  if (!adminEmail || !adminPassword) {
    throw new Error("Missing bootstrap admin credentials. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.")
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: hashedPassword,
      roleId: systemRole?.id,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: hashedPassword,
      roleId: systemRole?.id,
    },
  })

  await Promise.all(
    systemDocumentTypes.map((documentType) =>
      prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentType" ("id", "code", "name", "active", "isSystem", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT ("code") DO UPDATE
         SET "name" = EXCLUDED."name",
             "active" = EXCLUDED."active",
             "isSystem" = EXCLUDED."isSystem",
             "updatedAt" = NOW()`,
        randomUUID(),
        documentType.code,
        documentType.name,
        documentType.active,
        documentType.isSystem,
      ),
    ),
  )
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
