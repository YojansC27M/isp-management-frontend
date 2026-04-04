export type Role = "admin" | "staff" | "support" | "billing" | "technician" | "client"

export type Permission =
  | "clients.read"
  | "clients.write"
  | "plans.read"
  | "plans.write"
  | "payments.read"
  | "payments.write"
  | "invoices.read"
  | "invoices.write"
  | "tickets.read"
  | "tickets.write"
  | "visits.read"
  | "visits.write"
  | "monitoring.read"
  | "reports.read"
  | "clients_map.read"
  | "client_portal.read"
  | "client_portal.write"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
}
