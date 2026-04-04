import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ClientFormValues } from "@/modules/clients/types/client"
import type { PlanFormValues } from "@/modules/plans/types/plan"
import type { PaymentFormValues } from "@/modules/payments/types/payment"
import type { TicketFormValues } from "@/modules/tickets/types/ticket"
import type { VisitFormValues } from "@/modules/visits/types/visit"
import type { ClientMapFiltersValues } from "@/modules/clients-map/types/clientMap"
import type { ReportsFiltersValues } from "@/modules/reports/types/report"
import {
  accountStatusByClientId,
  clientPortalInvoices,
  clientPortalPayments,
  clientPortalProfile,
  clientPortalTickets,
  clients,
  clientsMap,
  invoices,
  overdueClients,
  payments,
  plans,
  reportMetrics,
  revenueData,
  routerInterfacesById,
  routerMetricsById,
  routers,
  statusDistribution,
  ticketComments,
  tickets,
  visits,
} from "./data"

const ok = <T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config,
})

const notFound = (config: InternalAxiosRequestConfig): AxiosResponse<{ message: string }> => ({
  data: { message: "Not found" },
  status: 404,
  statusText: "Not Found",
  headers: {},
  config,
})

const parseBody = <T>(config: InternalAxiosRequestConfig): T | null => {
  if (!config.data) return null
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data) as T
    } catch {
      return null
    }
  }
  return config.data as T
}

const getPath = (url?: string) => {
  if (!url) return ""
  try {
    return new URL(url, "http://localhost").pathname
  } catch {
    return url
  }
}

const getParam = (config: InternalAxiosRequestConfig, key: string): string => {
  const params = config.params
  if (!params || typeof params !== "object") return ""
  const value = (params as Record<string, unknown>)[key]
  if (value === undefined || value === null) return ""
  return String(value)
}

const matches = (value: string, query: string) => value.toLowerCase().includes(query.toLowerCase())

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`

const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase()
  const path = getPath(config.url)

  if (method === "get" && path === "/clients") {
    return ok(config, clients)
  }

  if (method === "get" && path.startsWith("/clients/")) {
    const id = path.split("/")[2]
    const client = clients.find((item) => item.id === id)
    return client ? ok(config, client) : notFound(config)
  }

  if (method === "post" && path === "/clients") {
    const payload = parseBody<ClientFormValues>(config)
    if (!payload) return notFound(config)
    const created = { id: generateId(), ...payload }
    clients.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/clients/")) {
    const id = path.split("/")[2]
    const payload = parseBody<ClientFormValues>(config)
    const index = clients.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    clients[index] = { ...clients[index], ...payload }
    return ok(config, clients[index])
  }

  if (method === "delete" && path.startsWith("/clients/")) {
    const id = path.split("/")[2]
    const index = clients.findIndex((item) => item.id === id)
    if (index === -1) return notFound(config)
    clients.splice(index, 1)
    return ok(config, null)
  }

  if (method === "get" && path === "/plans") {
    return ok(config, plans)
  }

  if (method === "get" && path.startsWith("/plans/")) {
    const id = path.split("/")[2]
    const plan = plans.find((item) => item.id === id)
    return plan ? ok(config, plan) : notFound(config)
  }

  if (method === "post" && path === "/plans") {
    const payload = parseBody<PlanFormValues>(config)
    if (!payload) return notFound(config)
    const created = { id: generateId(), ...payload }
    plans.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/plans/")) {
    const id = path.split("/")[2]
    const payload = parseBody<PlanFormValues>(config)
    const index = plans.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    plans[index] = { ...plans[index], ...payload }
    return ok(config, plans[index])
  }

  if (method === "delete" && path.startsWith("/plans/")) {
    const id = path.split("/")[2]
    const index = plans.findIndex((item) => item.id === id)
    if (index === -1) return notFound(config)
    plans.splice(index, 1)
    return ok(config, null)
  }

  if (method === "get" && path === "/payments") {
    return ok(config, payments)
  }

  if (method === "get" && path.startsWith("/payments/")) {
    const segments = path.split("/")
    if (segments[2] === "account-status") {
      const clientId = segments[3]
      const status = accountStatusByClientId[clientId]
      return ok(config, status ?? [])
    }
    const id = segments[2]
    const payment = payments.find((item) => item.id === id)
    return payment ? ok(config, payment) : notFound(config)
  }

  if (method === "post" && path === "/payments") {
    const payload = parseBody<PaymentFormValues>(config)
    if (!payload) return notFound(config)
    const created = { id: generateId(), clientName: "New Client", ...payload }
    payments.push(created)
    return ok(config, created, 201)
  }

  if (method === "get" && path === "/tickets") {
    return ok(config, tickets)
  }

  if (method === "get" && path.startsWith("/tickets/")) {
    const segments = path.split("/")
    const id = segments[2]
    const ticket = tickets.find((item) => item.id === id)
    return ticket ? ok(config, ticket) : notFound(config)
  }

  if (method === "post" && path === "/tickets") {
    const payload = parseBody<TicketFormValues>(config)
    if (!payload) return notFound(config)
    const created = { id: generateId(), clientName: "New Client", createdAt: new Date().toISOString(), ...payload }
    tickets.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/tickets/")) {
    const id = path.split("/")[2]
    const payload = parseBody<TicketFormValues>(config)
    const index = tickets.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    tickets[index] = { ...tickets[index], ...payload }
    return ok(config, tickets[index])
  }

  if (method === "post" && path.endsWith("/comments")) {
    const ticketId = path.split("/")[2]
    const payload = parseBody<{ message: string }>(config)
    const comment = {
      id: generateId(),
      ticketId,
      message: payload?.message ?? "",
      createdAt: new Date().toISOString(),
      author: "You",
    }
    ticketComments.unshift(comment)
    return ok(config, comment, 201)
  }

  if (method === "get" && path === "/visits") {
    return ok(config, visits)
  }

  if (method === "get" && path.startsWith("/visits/")) {
    const id = path.split("/")[2]
    const visit = visits.find((item) => item.id === id)
    return visit ? ok(config, visit) : notFound(config)
  }

  if (method === "post" && path === "/visits") {
    const payload = parseBody<VisitFormValues>(config)
    if (!payload) return notFound(config)
    const created = {
      id: generateId(),
      clientName: "New Client",
      technicianName: "New Technician",
      ...payload,
    }
    visits.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/visits/")) {
    const id = path.split("/")[2]
    const payload = parseBody<VisitFormValues>(config)
    const index = visits.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    visits[index] = { ...visits[index], ...payload }
    return ok(config, visits[index])
  }

  if (method === "get" && path === "/monitoring/routers") {
    return ok(config, routers)
  }

  if (method === "get" && path.includes("/monitoring/routers/") && path.endsWith("/metrics")) {
    const routerId = path.split("/")[3]
    const metrics = routerMetricsById[routerId]
    return metrics ? ok(config, metrics) : notFound(config)
  }

  if (method === "get" && path.includes("/monitoring/routers/") && path.endsWith("/interfaces")) {
    const routerId = path.split("/")[3]
    const data = routerInterfacesById[routerId]
    return ok(config, data ?? [])
  }

  if (method === "get" && path === "/clients-map") {
    const filters: ClientMapFiltersValues = {
      status: (getParam(config, "status") as ClientMapFiltersValues["status"]) || "",
      zone: getParam(config, "zone"),
      technicianName: getParam(config, "technicianName"),
    }

    const filtered = clientsMap.filter((item) => {
      const statusMatch = !filters.status || item.status === filters.status
      const zoneMatch = !filters.zone || matches(item.zone, filters.zone)
      const techMatch = !filters.technicianName || matches(item.technicianName, filters.technicianName)
      return statusMatch && zoneMatch && techMatch
    })

    return ok(config, filtered)
  }

  if (method === "get" && path === "/invoices") {
    return ok(config, invoices)
  }

  if (method === "get" && path.startsWith("/invoices/") && path.endsWith("/pdf")) {
    const blob = new Blob(["Mock invoice PDF"], { type: "application/pdf" })
    return ok(config, blob)
  }

  if (method === "get" && path.startsWith("/invoices/")) {
    const id = path.split("/")[2]
    const invoice = invoices.find((item) => item.id === id)
    return invoice ? ok(config, invoice) : notFound(config)
  }

  if (method === "get" && path === "/reports/metrics") {
    return ok(config, reportMetrics)
  }

  if (method === "get" && path === "/reports/revenue") {
    const filters: ReportsFiltersValues = {
      dateFrom: getParam(config, "dateFrom"),
      dateTo: getParam(config, "dateTo"),
      zone: getParam(config, "zone"),
      plan: getParam(config, "plan"),
    }
    const filtered = revenueData.filter((item) => {
      if (filters.dateFrom && item.date < filters.dateFrom) return false
      if (filters.dateTo && item.date > filters.dateTo) return false
      return true
    })
    return ok(config, filtered)
  }

  if (method === "get" && path === "/reports/status") {
    return ok(config, statusDistribution)
  }

  if (method === "get" && path === "/reports/overdue") {
    return ok(config, overdueClients)
  }

  if (method === "post" && path === "/client-portal/login") {
    const payload = parseBody<{ email: string; password: string }>(config)
    if (!payload?.email || !payload.password) return notFound(config)
    if (payload.email !== "admin@isp.com" || payload.password !== "123456") {
      return {
        data: { message: "Invalid credentials" },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
      }
    }
    return ok(config, { token: "mock-client-token" })
  }

  if (method === "get" && path === "/client-portal/profile") {
    return ok(config, clientPortalProfile)
  }

  if (method === "get" && path === "/client-portal/invoices") {
    return ok(config, clientPortalInvoices)
  }

  if (method === "get" && path === "/client-portal/payments") {
    return ok(config, clientPortalPayments)
  }

  if (method === "get" && path === "/client-portal/tickets") {
    return ok(config, clientPortalTickets)
  }

  return notFound(config)
}

export default mockAdapter
