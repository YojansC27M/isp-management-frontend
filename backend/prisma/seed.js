"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const roles = [
    { key: "super_admin", name: "Super Admin", description: "Acceso total al sistema", isSystem: true },
    { key: "admin", name: "Admin", description: "Administracion operativa general", isSystem: true },
    { key: "staff", name: "Staff", description: "Operacion general de plataforma", isSystem: true },
    { key: "technician", name: "Tecnico", description: "Operacion de campo y routers", isSystem: true },
    { key: "support", name: "Soporte", description: "Atencion de tickets y visitas", isSystem: true },
    { key: "client", name: "Cliente", description: "Acceso al portal de cliente", isSystem: true },
];
const permissions = [
    { key: "dashboard.read", module: "Dashboard", label: "Ver dashboard", description: "Puede ver el panel principal." },
    { key: "clients.read", module: "Clientes", label: "Ver clientes", description: "Puede consultar clientes." },
    { key: "clients.write", module: "Clientes", label: "Gestionar clientes", description: "Puede crear y editar clientes." },
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
    { key: "system_settings.read", module: "Seguridad", label: "Ver configuracion", description: "Puede consultar la configuracion del sistema." },
    { key: "system_settings.write", module: "Seguridad", label: "Gestionar configuracion", description: "Puede editar la configuracion del sistema." },
    { key: "audit.read", module: "Seguridad", label: "Ver auditoria", description: "Puede consultar auditoria de seguridad." },
];
async function main() {
    const createdRoles = await Promise.all(roles.map((role) => prisma.role.upsert({
        where: { key: role.key },
        update: role,
        create: role,
    })));
    const createdPermissions = await Promise.all(permissions.map((permission) => prisma.permission.upsert({
        where: { key: permission.key },
        update: permission,
        create: permission,
    })));
    const systemRole = createdRoles.find((role) => role.key === "super_admin");
    if (systemRole) {
        await Promise.all(createdPermissions.map((permission) => prisma.rolePermission.upsert({
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
        })));
    }
}
main()
    .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
