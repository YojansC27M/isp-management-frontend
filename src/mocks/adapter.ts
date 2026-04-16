import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ClientFormValues } from "@/modules/clients/types/client"
import type { PlanFormValues } from "@/modules/plans/types/plan"
import type { PaymentFormValues } from "@/modules/payments/types/payment"
import type { TicketFormValues } from "@/modules/tickets/types/ticket"
import type { VisitFormValues } from "@/modules/visits/types/visit"
import type { ClientMapFiltersValues } from "@/modules/clients-map/types/clientMap"
import type { ReportsFiltersValues } from "@/modules/reports/types/report"
import type { InternalUserFormValues } from "@/modules/internal-users/types/internalUser"
import type { ManagedRouter, RouterFormValues, RouterStatus } from "@/modules/routers/types/router"
import type { SystemSettingsFormValues } from "@/modules/system-settings/types/systemSettings"
import {
  accountStatusByClientId,
  clientPortalInvoices,
  clientPortalPayments,
  clientPortalProfile,
  clientPortalTickets,
  clients,
  clientsMap,
  invoices,
  internalUsers,
  overdueClients,
  payments,
  plans,
  reportMetrics,
  revenueData,
  routerHealthById,
  routerInterfacesById,
  managedRouters,
  routerMetricsById,
  routers,
  statusDistribution,
  systemSettings,
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

const mockNavigationConfig = {
  modules: [
    { id: "dashboard" },
    { id: "internal-users" },
    { id: "clients", items: ["clients-list", "clients-map"] },
    { id: "commercial", items: ["plans", "payments", "invoices"] },
    { id: "support", items: ["tickets", "visits"] },
    { id: "operations", items: ["routers", "monitoring", "reports"] },
    { id: "security", items: ["settings-system", "access-control", "security-audit"] },
  ],
}

const getAssignableTechnician = (id: string) => {
  return internalUsers.find((user) => user.id === id && user.role === "technician" && user.status === "active")
}

const getAssignableTicketUser = (id: string) => {
  return internalUsers.find(
    (user) =>
      user.id === id &&
      user.status === "active" &&
      (user.role === "support" || user.role === "staff" || user.role === "admin"),
  )
}

const getExistingClient = (id: string) => {
  return clients.find((client) => client.id === id)
}

const normalizeRouterStatus = (ip: string): RouterStatus => (ip.endsWith(".1") ? "online" : "offline")

const toManagedRouter = (id: string, payload: RouterFormValues, previous?: (typeof managedRouters)[number]): ManagedRouter => ({
  id,
  name: payload.name,
  ip: payload.ip,
  port: payload.port,
  username: payload.username,
  passwordMasked: payload.password ? "*".repeat(Math.max(8, payload.password.length)) : previous?.passwordMasked ?? "********",
  zone: payload.zone,
  location: payload.location,
  latitude: payload.latitude,
  longitude: payload.longitude,
  status: normalizeRouterStatus(payload.ip),
  lastCheckedAt: new Date().toISOString(),
})

const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toLowerCase()
  const path = getPath(config.url)

  if (method === "get" && path === "/auth/navigation") {
    return ok(config, mockNavigationConfig)
  }

  if (method === "get" && path === "/clients") {
    return ok(config, clients)
  }

  if (method === "get" && path === "/clients/search") {
    const query = getParam(config, "q").trim().toLowerCase()
    const limitRaw = Number.parseInt(getParam(config, "limit"), 10)
    const limit = Number.isNaN(limitRaw) ? 20 : Math.min(Math.max(limitRaw, 5), 50)

    if (!query || query.length < 2) return ok(config, [])

    const filtered = clients
      .filter((client) => {
        const fields = [client.name, client.document, client.phone, client.email]
        return fields.some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(query) ? 1 : 0
        const bStartsWith = b.name.toLowerCase().startsWith(query) ? 1 : 0
        if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith
        return a.name.localeCompare(b.name)
      })
      .slice(0, limit)

    return ok(config, filtered)
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
    const client = getExistingClient(payload.clientId)
    if (!client) {
      return {
        data: { message: "Client is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const created = { id: generateId(), clientName: client.name, ...payload }
    payments.push(created)
    return ok(config, created, 201)
  }

  if (method === "get" && path === "/internal-users") {
    return ok(config, internalUsers)
  }

  if (method === "get" && path.startsWith("/internal-users/")) {
    const id = path.split("/")[2]
    const user = internalUsers.find((item) => item.id === id)
    return user ? ok(config, user) : notFound(config)
  }

  if (method === "post" && path === "/internal-users") {
    const payload = parseBody<InternalUserFormValues>(config)
    if (!payload) return notFound(config)
    const created = { id: `iu-${generateId()}`, ...payload }
    internalUsers.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/internal-users/")) {
    const id = path.split("/")[2]
    const payload = parseBody<InternalUserFormValues>(config)
    const index = internalUsers.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    internalUsers[index] = { ...internalUsers[index], ...payload }
    return ok(config, internalUsers[index])
  }

  if (method === "delete" && path.startsWith("/internal-users/")) {
    const id = path.split("/")[2]
    const index = internalUsers.findIndex((item) => item.id === id)
    if (index === -1) return notFound(config)
    internalUsers.splice(index, 1)
    return ok(config, null)
  }

  if (method === "get" && path === "/tickets") {
    return ok(config, tickets)
  }

  if (method === "get" && path.startsWith("/tickets/")) {
    const segments = path.split("/")
    if (segments[3] === "comments") {
      const ticketId = segments[2]
      const comments = ticketComments.filter((comment) => comment.ticketId === ticketId)
      return ok(config, comments)
    }
    const id = segments[2]
    const ticket = tickets.find((item) => item.id === id)
    return ticket ? ok(config, ticket) : notFound(config)
  }

  if (method === "post" && path === "/tickets") {
    const payload = parseBody<TicketFormValues>(config)
    if (!payload) return notFound(config)
    const client = getExistingClient(payload.clientId)
    if (!client) {
      return {
        data: { message: "Client is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const assigneeUser = payload.assignedUserId ? getAssignableTicketUser(payload.assignedUserId) : null
    if (payload.assignedUserId && !assigneeUser) {
      return {
        data: { message: "Assigned internal user is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const isBilling = payload.category === "billing"
    const technician = !isBilling && payload.assignedTechnicianId ? getAssignableTechnician(payload.assignedTechnicianId) : null
    if (!isBilling && payload.assignedTechnicianId && !technician) {
      return {
        data: { message: "Assigned technician is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const createdAt = new Date().toISOString()
    const created = {
      id: generateId(),
      clientName: client.name,
      createdAt,
      ...payload,
      assignedUserName: assigneeUser?.name ?? "Sin asignar",
      assignedTechnicianId: isBilling ? "" : payload.assignedTechnicianId,
      assignedTechnicianName: technician?.name ?? "Sin asignar",
      history: [
        {
          id: `h-${generateId()}`,
          ticketId: "temp",
          message: "Ticket creado en la plataforma.",
          createdAt,
        },
      ],
    }
    created.history[0].ticketId = created.id
    tickets.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/tickets/")) {
    const id = path.split("/")[2]
    const payload = parseBody<TicketFormValues>(config)
    const index = tickets.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    const client = getExistingClient(payload.clientId)
    if (!client) {
      return {
        data: { message: "Client is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const assigneeUser = payload.assignedUserId ? getAssignableTicketUser(payload.assignedUserId) : null
    if (payload.assignedUserId && !assigneeUser) {
      return {
        data: { message: "Assigned internal user is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const isBilling = payload.category === "billing"
    const technician = !isBilling && payload.assignedTechnicianId ? getAssignableTechnician(payload.assignedTechnicianId) : null
    if (!isBilling && payload.assignedTechnicianId && !technician) {
      return {
        data: { message: "Assigned technician is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const previousStatus = tickets[index].status
    const nextHistory = [...tickets[index].history]
    if (previousStatus !== payload.status) {
      nextHistory.unshift({
        id: `h-${generateId()}`,
        ticketId: id,
        message: `Estado actualizado de ${previousStatus} a ${payload.status}.`,
        createdAt: new Date().toISOString(),
      })
    }
    tickets[index] = {
      ...tickets[index],
      ...payload,
      clientName: client.name,
      assignedUserName: assigneeUser?.name ?? "Sin asignar",
      assignedTechnicianId: isBilling ? "" : payload.assignedTechnicianId,
      assignedTechnicianName: technician?.name ?? "Sin asignar",
    }
    tickets[index].history = nextHistory
    return ok(config, tickets[index])
  }

  if (method === "post" && path.endsWith("/comments")) {
    const ticketId = path.split("/")[2]
    const payload = parseBody<{ message: string; visibility?: "public" | "internal" }>(config)
    const comment = {
      id: generateId(),
      ticketId,
      message: payload?.message ?? "",
      createdAt: new Date().toISOString(),
      author: "You",
      visibility: payload?.visibility ?? "public",
    }
    ticketComments.unshift(comment)
    const ticketIndex = tickets.findIndex((ticket) => ticket.id === ticketId)
    if (ticketIndex >= 0) {
      const note =
        comment.visibility === "internal"
          ? "Se agrego una nota interna."
          : "Se agrego un comentario publico."
      tickets[ticketIndex].history.unshift({
        id: `h-${generateId()}`,
        ticketId,
        message: note,
        createdAt: comment.createdAt,
      })
    }
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
    const client = getExistingClient(payload.clientId)
    if (!client) {
      return {
        data: { message: "Client is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const technician = payload.technicianId ? getAssignableTechnician(payload.technicianId) : null
    if (payload.technicianId && !technician) {
      return {
        data: { message: "Assigned technician is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const created = {
      id: generateId(),
      clientName: client.name,
      ...payload,
      technicianName: technician?.name ?? "Sin asignar",
    }
    visits.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/visits/")) {
    const id = path.split("/")[2]
    const payload = parseBody<VisitFormValues>(config)
    const index = visits.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    const client = getExistingClient(payload.clientId)
    if (!client) {
      return {
        data: { message: "Client is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const technician = payload.technicianId ? getAssignableTechnician(payload.technicianId) : null
    if (payload.technicianId && !technician) {
      return {
        data: { message: "Assigned technician is not active or not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    visits[index] = { ...visits[index], ...payload, clientName: client.name, technicianName: technician?.name ?? "Sin asignar" }
    return ok(config, visits[index])
  }

  if (method === "get" && path === "/monitoring/routers") {
    return ok(config, routers)
  }

  if (method === "get" && path === "/settings/system") {
    return ok(config, systemSettings)
  }

  if (method === "put" && path === "/settings/system") {
    const payload = parseBody<SystemSettingsFormValues>(config)
    if (!payload) return notFound(config)
    Object.assign(systemSettings, payload)
    return ok(config, systemSettings)
  }

  if (method === "post" && path === "/settings/system/logo") {
    const payload = parseBody<{ fileName?: string }>(config)
    const fileLabel = payload?.fileName ? encodeURIComponent(payload.fileName) : "logo"
    systemSettings.logoUrl = `https://placehold.co/240x120/png?text=${fileLabel}`
    return ok(config, { logoUrl: systemSettings.logoUrl })
  }

  if (method === "get" && path === "/routers") {
    const search = getParam(config, "search").trim().toLowerCase()
    const statusFilter = getParam(config, "status").trim()
    const zoneFilter = getParam(config, "zone").trim().toLowerCase()
    const filtered = managedRouters.filter((router) => {
      const searchMatch =
        !search ||
        [router.name, router.ip, router.username, router.location, router.zone]
          .join(" ")
          .toLowerCase()
          .includes(search)
      const statusMatch = !statusFilter || router.status === statusFilter
      const zoneMatch = !zoneFilter || router.zone.toLowerCase().includes(zoneFilter)
      return searchMatch && statusMatch && zoneMatch
    })
    return ok(config, filtered)
  }

  if (method === "get" && path.startsWith("/routers/") && path.endsWith("/health")) {
    const routerId = path.split("/")[2]
    return ok(config, routerHealthById[routerId] ?? null)
  }

  if (method === "get" && path.startsWith("/routers/")) {
    const routerId = path.split("/")[2]
    const router = managedRouters.find((item) => item.id === routerId)
    return router ? ok(config, router) : notFound(config)
  }

  if (method === "post" && path === "/routers/test-connection") {
    const payload = parseBody<RouterFormValues>(config)
    if (!payload) return notFound(config)
    const success = payload.ip.endsWith(".1") || payload.ip.endsWith(".10") || payload.ip.endsWith(".254")
    const latency = success ? 8 + Math.floor(Math.random() * 20) : null
    return ok(config, {
      success,
      message: success ? "Conexion API RouterOS validada." : "No fue posible establecer sesion con el router.",
      latencyMs: latency,
      checkedAt: new Date().toISOString(),
    })
  }

  if (method === "post" && path.startsWith("/routers/") && path.endsWith("/test-connection")) {
    const routerId = path.split("/")[2]
    const router = managedRouters.find((item) => item.id === routerId)
    if (!router) return notFound(config)
    const success = router.status === "online"
    const latency = success ? 9 + Math.floor(Math.random() * 15) : null
    router.lastCheckedAt = new Date().toISOString()
    return ok(config, {
      success,
      message: success ? "Conexion al router confirmada." : "Router sin respuesta o con credenciales invalidas.",
      latencyMs: latency,
      checkedAt: router.lastCheckedAt,
    })
  }

  if (method === "post" && path === "/routers") {
    const payload = parseBody<RouterFormValues>(config)
    if (!payload) return notFound(config)
    const created = toManagedRouter(`router-${generateId()}`, payload)
    managedRouters.unshift(created)
    routerHealthById[created.id] = {
      cpuUsage: 0,
      ramUsage: 0,
      uptime: "0d 0h",
      interfacesUp: 0,
      interfacesDown: 0,
      throughput: "0 Mbps",
    }
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/routers/")) {
    const routerId = path.split("/")[2]
    const payload = parseBody<RouterFormValues>(config)
    const index = managedRouters.findIndex((item) => item.id === routerId)
    if (index === -1 || !payload) return notFound(config)
    managedRouters[index] = toManagedRouter(routerId, payload, managedRouters[index])
    return ok(config, managedRouters[index])
  }

  if (method === "delete" && path.startsWith("/routers/")) {
    const routerId = path.split("/")[2]
    const index = managedRouters.findIndex((item) => item.id === routerId)
    if (index === -1) return notFound(config)
    managedRouters.splice(index, 1)
    delete routerHealthById[routerId]
    return ok(config, null)
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
