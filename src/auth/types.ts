export type Role = "super_admin" | "admin" | "staff" | "support" | "billing" | "technician" | "client"

export type Permission =
  | "dashboard.read"
  | "internal_users.read"
  | "internal_users.write"
  | "clients.read"
  | "clients.write"
  | "system_settings.read"
  | "system_settings.write"
  | "document_types.read"
  | "document_types.write"
  | "routers.read"
  | "routers.write"
  | "plans.read"
  | "plans.write"
  | "payments.read"
  | "payments.manual.write"
  | "invoices.read"
  | "invoices.write"
  | "tickets.read"
  | "tickets.write"
  | "visits.read"
  | "visits.write"
  | "monitoring.read"
  | "reports.read"
  | "clients_map.read"
  | "roles.read"
  | "roles.write"
  | "audit.read"
  | "client_portal.read"
  | "client_portal.write"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
}
