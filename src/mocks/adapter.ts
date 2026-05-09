import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import type { ClientFormValues } from "@/modules/clients/types/client"
import type { InvoiceCancelValues, InvoiceFormValues } from "@/modules/invoices/types/invoice"
import type { InstallationFormValues } from "@/modules/installations/types/installation"
import type { PlanFormValues } from "@/modules/plans/types/plan"
import type { PaymentFormValues } from "@/modules/payments/types/payment"
import type { ClientPortalCreateTicketPayload } from "@/modules/client-portal/types/clientPortal"
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
  documentTypes,
  systemSettings,
  installationMovements,
  ticketComments,
  tickets,
  installations,
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
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    return Object.fromEntries(config.data.entries()) as T
  }
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
const EARTH_RADIUS_KM = 6371

const toRadians = (value: number) => (value * Math.PI) / 180

const distanceKm = (latA: number, lngA: number, latB: number, lngB: number) => {
  const dLat = toRadians(latB - latA)
  const dLng = toRadians(lngB - lngA)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

const parsePolygon = (raw: string) => {
  if (!raw.trim()) return [] as Array<{ lat: number; lng: number }>
  const points = raw
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [latRaw, lngRaw] = chunk.split(",").map((part) => part.trim())
      const lat = Number(latRaw)
      const lng = Number(lngRaw)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    })
    .filter((point): point is { lat: number; lng: number } => point !== null)
  return points.length >= 3 ? points : []
}

const pointInPolygon = (lat: number, lng: number, polygon: Array<{ lat: number; lng: number }>) => {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.lng
    const yi = polygon[i]!.lat
    const xj = polygon[j]!.lng
    const yj = polygon[j]!.lat
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi
    if (intersects) inside = !inside
  }
  return inside
}

const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`

const mockNavigationConfig = {
  modules: [
    { id: "dashboard" },
    { id: "internal-users" },
    { id: "clients", items: ["clients-list", "clients-map"] },
    { id: "commercial", items: ["plans", "payments", "invoices"] },
    { id: "support", items: ["tickets", "visits"] },
    { id: "operations", items: ["routers", "monitoring", "reports"] },
    { id: "security", items: ["settings-system", "settings-document-types", "access-control", "security-audit"] },
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

const getExistingVisit = (id: string) => visits.find((visit) => visit.id === id)

const getExistingRouter = (id: string) => managedRouters.find((router) => router.id === id)

const getExistingInstallationByClient = (clientId: string) => installations.find((item) => item.clientId === clientId)

const getExistingInstallationById = (id: string) => installations.find((item) => item.id === id)

const buildInstallationRecord = (payload: InstallationFormValues, id = `inst-${generateId()}`) => {
  const client = getExistingClient(payload.clientId)
  const visit = payload.visitId ? getExistingVisit(payload.visitId) : null
  const router = getExistingRouter(payload.routerId)
  const now = new Date().toISOString()
  const installedAt = payload.installedAt ? new Date(payload.installedAt).toISOString() : null

  return {
    id,
    clientId: payload.clientId,
    clientName: client?.name ?? "",
    clientPhone: client?.phone ?? "",
    clientAddress: client?.address ?? "",
    clientStatus: client?.status ?? "active",
    clientPlan: client?.plan ?? "",
    visitId: payload.visitId || null,
    visitType: visit?.type ?? "",
    visitStatus: visit?.status ?? "",
    visitScheduledAt: visit ? new Date(`${visit.scheduledDate}T${visit.scheduledTime}:00.000Z`).toISOString() : null,
    routerId: payload.routerId || null,
    routerName: router?.name ?? "",
    routerIp: router?.ip ?? "",
    routerZone: router?.zone ?? "",
    routerLocation: router?.location ?? "",
    routerStatus: router?.status ?? "",
    operationType: payload.operationType,
    status: payload.status,
    installedAt,
    notes: payload.notes || "",
    createdAt: now,
    updatedAt: now,
  }
}

const buildMovementRecord = (record: ReturnType<typeof buildInstallationRecord> & { installationId: string | null }) => ({
  id: `mov-${generateId()}`,
  clientId: record.clientId,
  clientName: record.clientName,
  clientPhone: record.clientPhone,
  clientAddress: record.clientAddress,
  clientStatus: record.clientStatus,
  clientPlan: record.clientPlan,
  installationId: record.installationId,
  visitId: record.visitId,
  visitType: record.visitType,
  visitStatus: record.visitStatus,
  visitScheduledAt: record.visitScheduledAt,
  routerId: record.routerId,
  routerName: record.routerName,
  routerIp: record.routerIp,
  routerZone: record.routerZone,
  routerLocation: record.routerLocation,
  routerStatus: record.routerStatus,
  operationType: record.operationType,
  status: record.status,
  notes: record.notes,
  happenedAt: record.updatedAt,
  createdAt: record.updatedAt,
})

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
    const selectedPlan = plans.find((plan) => plan.id === payload.planId)
    const created = { id: generateId(), ...payload, plan: selectedPlan?.name ?? "Sin plan" }
    clients.push(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/clients/")) {
    const id = path.split("/")[2]
    const payload = parseBody<ClientFormValues>(config)
    const index = clients.findIndex((item) => item.id === id)
    if (index === -1 || !payload) return notFound(config)
    const selectedPlan = plans.find((plan) => plan.id === payload.planId)
    clients[index] = { ...clients[index], ...payload, plan: selectedPlan?.name ?? clients[index].plan }
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
    const search = getParam(config, "search").trim().toLowerCase()
    const role = getParam(config, "role").trim()
    const status = getParam(config, "status").trim()
    const cursor = getParam(config, "cursor").trim()
    const limitRaw = Number.parseInt(getParam(config, "limit"), 10)
    const pageRaw = Number.parseInt(getParam(config, "page"), 10)
    const perPageRaw = Number.parseInt(getParam(config, "perPage"), 10)
    const sortBy = getParam(config, "sortBy").trim() || "createdAt"
    const sortDir = getParam(config, "sortDir").trim() === "asc" ? "asc" : "desc"
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 25
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
    const perPage = Number.isFinite(perPageRaw) && perPageRaw > 0 ? Math.min(perPageRaw, 100) : 25

    const filtered = internalUsers
      .filter((user) => {
        const matchesSearch =
          !search || [user.name, user.email, user.phone, user.documentType, user.documentNumber].join(" ").toLowerCase().includes(search)
        const matchesRole = !role || user.role === role
        const matchesStatus = !status || user.status === status
        return matchesSearch && matchesRole && matchesStatus
      })
      .sort((a, b) => {
        const direction = sortDir === "asc" ? 1 : -1
        if (sortBy === "name") return a.name.localeCompare(b.name) * direction
        if (sortBy === "email") return a.email.localeCompare(b.email) * direction
        if (sortBy === "role") return a.role.localeCompare(b.role) * direction
        return 0
      })

    if (cursor || getParam(config, "limit")) {
      const startIndex = cursor ? Math.max(filtered.findIndex((item) => item.id === cursor) + 1, 0) : 0
      const slice = filtered.slice(startIndex, startIndex + limit + 1)
      const hasNext = slice.length > limit
      const items = hasNext ? slice.slice(0, limit) : slice
      const nextCursor = hasNext && items.length > 0 ? items[items.length - 1]?.id ?? null : null
      return ok(config, {
        items,
        meta: {
          mode: "cursor",
          limit,
          hasNext,
          nextCursor,
        },
      })
    }

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const boundedPage = Math.min(Math.max(1, page), totalPages)
    const start = (boundedPage - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return ok(config, {
      items,
      meta: {
        page: boundedPage,
        perPage,
        total,
        totalPages,
      },
    })
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
    const attachmentEntries =
      typeof FormData !== "undefined" && config.data instanceof FormData ? config.data.getAll("attachment") : []
    const attachmentFiles = attachmentEntries.filter((entry): entry is File => entry instanceof File)
    const attachments = attachmentFiles.map((file) => ({
      fileName: `mock-${generateId()}`,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      url: typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "",
    }))
    const created = {
      id: generateId(),
      clientName: client.name,
      clientPhone: client.phone ?? "",
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
      attachment: attachments[0] ?? null,
      attachments,
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
      clientPhone: client.phone ?? "",
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

  if (method === "get" && path === "/installations") {
    return ok(config, installations)
  }

  if (method === "get" && path.startsWith("/installations/")) {
    const segments = path.split("/")
    if (segments[2] === "client") {
      const clientId = segments[3]
      if (segments[4] === "movements") {
        const movements = installationMovements.filter((item) => item.clientId === clientId)
        return ok(config, movements)
      }
      const installation = installations.find((item) => item.clientId === clientId) ?? null
      return ok(config, installation)
    }
    if (segments[2] === "router") {
      const routerId = segments[3]
      const filtered = installations.filter((item) => item.routerId === routerId)
      return ok(config, filtered)
    }
    const id = segments[2]
    const installation = installations.find((item) => item.id === id)
    return installation ? ok(config, installation) : notFound(config)
  }

  if (method === "post" && path === "/installations") {
    const payload = parseBody<InstallationFormValues>(config)
    if (!payload?.clientId || !payload?.routerId) return notFound(config)
    const client = getExistingClient(payload.clientId)
    const router = getExistingRouter(payload.routerId)
    if (!client || !router) {
      return {
        data: { message: "Client or router is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    if (payload.visitId) {
      const visit = getExistingVisit(payload.visitId)
      if (!visit || visit.clientId !== client.id) {
        return {
          data: { message: "Visit does not belong to selected client." },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config,
        }
      }
    }
    if (getExistingInstallationByClient(client.id)) {
      return {
        data: { message: "Client already has an installation." },
        status: 409,
        statusText: "Conflict",
        headers: {},
        config,
      }
    }
    const created = buildInstallationRecord(payload)
    installations.unshift(created)
    installationMovements.unshift(buildMovementRecord({ ...created, installationId: created.id }))
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/installations/")) {
    const id = path.split("/")[2]
    const payload = parseBody<InstallationFormValues>(config)
    const index = installations.findIndex((item) => item.id === id)
    if (index === -1 || !payload?.clientId || !payload?.routerId) return notFound(config)
    const client = getExistingClient(payload.clientId)
    const router = getExistingRouter(payload.routerId)
    if (!client || !router) {
      return {
        data: { message: "Client or router is not valid." },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    if (payload.visitId) {
      const visit = getExistingVisit(payload.visitId)
      if (!visit || visit.clientId !== client.id) {
        return {
          data: { message: "Visit does not belong to selected client." },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config,
        }
      }
    }
    const updated = buildInstallationRecord(payload, id)
    installations[index] = updated
    installationMovements.unshift(buildMovementRecord({ ...updated, installationId: updated.id }))
    return ok(config, installations[index])
  }

  if (method === "delete" && path.startsWith("/installations/")) {
    const id = path.split("/")[2]
    const index = installations.findIndex((item) => item.id === id)
    if (index === -1) return notFound(config)
    const current = getExistingInstallationById(id)
    if (current) {
      installationMovements.unshift(
        buildMovementRecord({
          ...current,
          status: "canceled",
          operationType: "removal",
          notes: current.notes || "Registro eliminado",
          installationId: current.id,
          updatedAt: new Date().toISOString(),
        }),
      )
    }
    installations.splice(index, 1)
    return ok(config, { ok: true })
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

  if (method === "get" && path === "/settings/system/document-types") {
    const includeInactive = getParam(config, "includeInactive").trim() === "true"
    const search = getParam(config, "search").trim().toLowerCase()
    const status = getParam(config, "status").trim() as "all" | "active" | "inactive" | ""
    const pageRaw = Number.parseInt(getParam(config, "page"), 10)
    const perPageRaw = Number.parseInt(getParam(config, "perPage"), 10)
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
    const perPage = Number.isFinite(perPageRaw) && perPageRaw > 0 ? Math.min(perPageRaw, 100) : 25

    const filtered = documentTypes
      .filter((item) => {
        const matchesSearch = !search || item.code.toLowerCase().includes(search) || item.name.toLowerCase().includes(search)
        if (status === "active") return matchesSearch && item.active
        if (status === "inactive") return matchesSearch && !item.active
        if (!includeInactive) return matchesSearch && item.active
        return matchesSearch
      })
      .sort((a, b) => {
        if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1
        return a.code.localeCompare(b.code)
      })

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const boundedPage = Math.min(Math.max(1, page), totalPages)
    const start = (boundedPage - 1) * perPage
    const items = filtered.slice(start, start + perPage)

    return ok(config, {
      items,
      meta: {
        page: boundedPage,
        perPage,
        total,
        totalPages,
      },
    })
  }

  if (method === "post" && path === "/settings/system/document-types") {
    const payload = parseBody<{ code: string; name: string }>(config)
    if (!payload?.code || !payload?.name) return notFound(config)
    const code = payload.code.trim().toUpperCase()
    if (documentTypes.some((item) => item.code === code)) {
      return {
        data: { message: "Document type code already exists" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    const now = new Date().toISOString()
    const created = {
      id: `doc-${generateId()}`,
      code,
      name: payload.name.trim(),
      active: true,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    }
    documentTypes.unshift(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/settings/system/document-types/")) {
    const id = path.split("/")[4]
    const payload = parseBody<{ name: string; active?: boolean }>(config)
    const index = documentTypes.findIndex((item) => item.id === id)
    if (index === -1 || !payload?.name) return notFound(config)
    const active = typeof payload.active === "boolean" ? payload.active : documentTypes[index].active
    if (documentTypes[index].isSystem && active === false) {
      return {
        data: { message: "System document type cannot be deactivated" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    documentTypes[index] = {
      ...documentTypes[index],
      name: payload.name.trim(),
      active,
      updatedAt: new Date().toISOString(),
    }
    return ok(config, documentTypes[index])
  }

  if (method === "delete" && path.startsWith("/settings/system/document-types/")) {
    const id = path.split("/")[4]
    const index = documentTypes.findIndex((item) => item.id === id)
    if (index === -1) return notFound(config)
    if (documentTypes[index].isSystem) {
      return {
        data: { message: "System document type cannot be deactivated" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config,
      }
    }
    documentTypes[index] = {
      ...documentTypes[index],
      active: false,
      updatedAt: new Date().toISOString(),
    }
    return ok(config, documentTypes[index])
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
      geoMode: getParam(config, "polygon") ? "polygon" : getParam(config, "radiusKm") ? "radius" : "",
      centerLat: getParam(config, "centerLat"),
      centerLng: getParam(config, "centerLng"),
      radiusKm: getParam(config, "radiusKm"),
      polygon: getParam(config, "polygon"),
    }

    const centerLat = Number(filters.centerLat)
    const centerLng = Number(filters.centerLng)
    const radiusKm = Number(filters.radiusKm)
    const hasRadiusFilter =
      filters.geoMode === "radius" && Number.isFinite(centerLat) && Number.isFinite(centerLng) && Number.isFinite(radiusKm) && radiusKm > 0
    const polygonPoints = filters.geoMode === "polygon" ? parsePolygon(filters.polygon) : []

    const filtered = clientsMap.filter((item) => {
      const statusMatch = !filters.status || item.status === filters.status
      const zoneMatch = !filters.zone || matches(item.zone, filters.zone)
      const techMatch = !filters.technicianName || matches(item.technicianName, filters.technicianName)
      const radiusMatch = !hasRadiusFilter || distanceKm(centerLat, centerLng, item.latitude, item.longitude) <= radiusKm
      const polygonMatch = polygonPoints.length < 3 || pointInPolygon(item.latitude, item.longitude, polygonPoints)
      return statusMatch && zoneMatch && techMatch && radiusMatch && polygonMatch
    })

    return ok(config, filtered)
  }

  if (method === "get" && path === "/invoices") {
    return ok(config, invoices)
  }

  if (method === "post" && path === "/invoices") {
    const payload = parseBody<InvoiceFormValues>(config)
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
    const created = {
      id: `inv-${generateId()}`,
      clientId: payload.clientId,
      clientName: client.name,
      invoiceNumber: payload.invoiceNumber.trim(),
      amount: payload.amount,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: payload.status,
      cancelledAt: null,
      cancellationReason: null,
    }
    invoices.unshift(created)
    return ok(config, created, 201)
  }

  if (method === "put" && path.startsWith("/invoices/")) {
    const id = path.split("/")[2]
    const payload = parseBody<InvoiceFormValues>(config)
    const index = invoices.findIndex((item) => item.id === id)
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
    const current = invoices[index]
    invoices[index] = {
      ...current,
      clientId: payload.clientId,
      clientName: client.name,
      invoiceNumber: payload.invoiceNumber.trim(),
      amount: payload.amount,
      issueDate: payload.issueDate,
      dueDate: payload.dueDate,
      status: payload.status,
      cancelledAt: payload.status === "cancelled" ? current.cancelledAt ?? new Date().toISOString() : null,
      cancellationReason: payload.status === "cancelled" ? current.cancellationReason : null,
    }
    return ok(config, invoices[index])
  }

  if (method === "post" && path.startsWith("/invoices/") && path.endsWith("/cancel")) {
    const id = path.split("/")[2]
    const payload = parseBody<InvoiceCancelValues>(config)
    const index = invoices.findIndex((item) => item.id === id)
    if (index === -1 || !payload?.reason?.trim()) return notFound(config)
    invoices[index] = {
      ...invoices[index],
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancellationReason: payload.reason.trim(),
    }
    return ok(config, invoices[index])
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
    return ok(config, { token: "mock-client-token", clientId: "1", expiresInSeconds: 60 * 60 * 8 })
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

  if (method === "post" && path === "/client-portal/tickets") {
    const payload = parseBody<ClientPortalCreateTicketPayload>(config)
    if (!payload) return notFound(config)
    const attachmentEntries =
      typeof FormData !== "undefined" && config.data instanceof FormData ? config.data.getAll("attachment") : []
    const attachmentFiles = attachmentEntries.filter((entry): entry is File => entry instanceof File)
    const attachments = attachmentFiles.map((file) => ({
      fileName: `mock-${generateId()}`,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      url: typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : "",
    }))
    const created = {
      id: `pt-${generateId()}`,
      title: payload.title,
      status: "open" as const,
      createdAt: new Date().toISOString().slice(0, 10),
      priority: payload.priority,
      updatedAt: new Date().toISOString().slice(0, 10),
      channel: "web" as const,
      messageCount: 1,
      attachment: attachments[0] ?? null,
      attachments,
    }
    clientPortalTickets.unshift(created)
    return ok(config, created, 201)
  }

  return notFound(config)
}

export default mockAdapter
