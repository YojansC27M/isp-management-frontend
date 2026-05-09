import type { Client } from "@/modules/clients/types/client"
import type { ClientMapItem } from "@/modules/clients-map/types/clientMap"
import type { Invoice } from "@/modules/invoices/types/invoice"
import type { InterfaceStatus, Router, RouterMetrics } from "@/modules/monitoring/types/monitoring"
import type { Payment, AccountStatusItem } from "@/modules/payments/types/payment"
import type { Plan } from "@/modules/plans/types/plan"
import type { OverdueClient, ReportMetrics, RevenueData, StatusDistribution } from "@/modules/reports/types/report"
import type { Installation } from "@/modules/installations/types/installation"
import type { InstallationMovement } from "@/modules/installations/types/installation"
import type { Ticket, TicketComment } from "@/modules/tickets/types/ticket"
import type { Visit } from "@/modules/visits/types/visit"
import type { ClientInvoice, ClientPayment, ClientProfile, ClientTicket } from "@/modules/client-portal/types/clientPortal"
import type { InternalUser } from "@/modules/internal-users/types/internalUser"
import type { ManagedRouter, RouterHealth } from "@/modules/routers/types/router"
import type { DocumentTypeItem, SystemSettings } from "@/modules/system-settings/types/systemSettings"

export const clients: Client[] = [
  {
    id: "1",
    name: "Mariana Torres",
    document: "CC-102030",
    address: "Av. Central 123",
    phone: "+57 300 123 4567",
    email: "mariana.torres@example.com",
    planId: "p2",
    plan: "Fiber 200",
    ipAddress: "192.168.10.23",
    status: "active",
    latitude: 4.711,
    longitude: -74.0721,
  },
  {
    id: "2",
    name: "Carlos Rojas",
    document: "CC-405060",
    address: "Calle 45 #21-18",
    phone: "+57 301 555 1111",
    email: "carlos.rojas@example.com",
    planId: "p1",
    plan: "Home 50",
    ipAddress: "192.168.10.44",
    status: "suspended",
    latitude: 4.65,
    longitude: -74.09,
  },
  {
    id: "3",
    name: "Laura G\u00f3mez",
    document: "CC-708090",
    address: "Carrera 8 #90-12",
    phone: "+57 302 888 2222",
    email: "laura.gomez@example.com",
    planId: "p3",
    plan: "Business 500",
    ipAddress: "192.168.10.77",
    status: "inactive",
    latitude: 4.75,
    longitude: -74.05,
  },
]

export const plans: Plan[] = [
  {
    id: "p1",
    name: "Home 50",
    downloadSpeed: 50,
    uploadSpeed: 20,
    price: 29.99,
    type: "residential",
  },
  {
    id: "p2",
    name: "Fiber 200",
    downloadSpeed: 200,
    uploadSpeed: 80,
    price: 59.99,
    type: "residential",
  },
  {
    id: "p3",
    name: "Business 500",
    downloadSpeed: 500,
    uploadSpeed: 200,
    price: 149.99,
    type: "business",
  },
]

export const payments: Payment[] = [
  {
    id: "pay-1",
    clientId: "1",
    clientName: "Mariana Torres",
    invoiceNumber: "INV-2024-001",
    amount: 59.99,
    paymentMethod: "card",
    paymentDate: "2024-10-03",
    status: "paid",
  },
  {
    id: "pay-2",
    clientId: "2",
    clientName: "Carlos Rojas",
    invoiceNumber: "INV-2024-002",
    amount: 29.99,
    paymentMethod: "transfer",
    paymentDate: "2024-10-05",
    status: "pending",
  },
]

export const accountStatusByClientId: Record<string, AccountStatusItem[]> = {
  "1": [
    {
      id: "acc-1",
      invoiceNumber: "INV-2024-001",
      dueDate: "2024-10-10",
      amount: 59.99,
      status: "paid",
    },
  ],
  "2": [
    {
      id: "acc-2",
      invoiceNumber: "INV-2024-002",
      dueDate: "2024-10-12",
      amount: 29.99,
      status: "pending",
    },
  ],
  "3": [
    {
      id: "acc-3",
      invoiceNumber: "INV-2024-003",
      dueDate: "2024-10-08",
      amount: 149.99,
      status: "overdue",
    },
  ],
}

export const tickets: Ticket[] = [
  {
    id: "t1",
    clientId: "1",
    clientName: "Mariana Torres",
    clientPhone: "+57 300 123 4567",
    assignedUserId: "iu-staff-1",
    assignedUserName: "Laura Salgado",
    assignedTechnicianId: "iu-tech-1",
    assignedTechnicianName: "Jorge Ruiz",
    title: "Intermittent connection",
    description: "Internet drops every few minutes.",
    status: "open",
    priority: "high",
    category: "technical",
    createdAt: "2024-10-01",
    history: [
      {
        id: "h1",
        ticketId: "t1",
        message: "Ticket creado por el cliente.",
        createdAt: "2024-10-01T09:00:00Z",
      },
      {
        id: "h2",
        ticketId: "t1",
        message: "Asignado a Jorge Ruiz.",
        createdAt: "2024-10-01T09:15:00Z",
      },
    ],
  },
  {
    id: "t2",
    clientId: "2",
    clientName: "Carlos Rojas",
    clientPhone: "+57 301 555 1111",
    assignedUserId: "iu-support-1",
    assignedUserName: "Paula Cardenas",
    assignedTechnicianId: "",
    assignedTechnicianName: "Sin asignar",
    title: "Billing question",
    description: "Invoice shows extra charges.",
    status: "in_progress",
    priority: "medium",
    category: "billing",
    createdAt: "2024-10-02",
    history: [
      {
        id: "h3",
        ticketId: "t2",
        message: "Ticket creado por soporte.",
        createdAt: "2024-10-02T12:00:00Z",
      },
    ],
  },
]

export const ticketComments: TicketComment[] = [
  {
    id: "c1",
    ticketId: "t1",
    message: "We are reviewing your modem logs.",
    createdAt: "2024-10-01T10:30:00Z",
    author: "Support Agent",
    visibility: "public",
  },
  {
    id: "c2",
    ticketId: "t1",
    message: "Validar potencia de RX en visita tecnica.",
    createdAt: "2024-10-01T11:00:00Z",
    author: "Jorge Ruiz",
    visibility: "internal",
  },
]

export const visits: Visit[] = [
  {
    id: "v1",
    clientId: "1",
    clientName: "Mariana Torres",
    technicianId: "iu-tech-1",
    technicianName: "Jorge Ruiz",
    zone: "North",
    type: "support",
    scheduledDate: "2024-10-06",
    scheduledTime: "10:30",
    status: "completed",
    notes: "Check router signal levels.",
  },
  {
    id: "v2",
    clientId: "3",
    clientName: "Laura G\u00f3mez",
    technicianId: "iu-tech-2",
    technicianName: "Sara V\u00e9lez",
    zone: "South",
    type: "installation",
    scheduledDate: "2024-10-07",
    scheduledTime: "14:00",
    status: "completed",
    notes: "New business install.",
  },
]

export const routers: Router[] = [
  {
    id: "r1",
    name: "Core Router",
    ip: "10.0.0.1",
    location: "Data Center",
    status: "online",
  },
  {
    id: "r2",
    name: "Edge Router",
    ip: "10.0.1.1",
    location: "North POP",
    status: "offline",
  },
]

export const routerMetricsById: Record<string, RouterMetrics> = {
  r1: {
    cpuUsage: 42,
    ramUsage: 68,
    uptime: "12d 4h",
    totalTraffic: "210.00 Mbps",
    rxTraffic: "120.00 Mbps",
    txTraffic: "90.00 Mbps",
    degraded: false,
  },
  r2: {
    cpuUsage: 0,
    ramUsage: 0,
    uptime: "0d 0h",
    totalTraffic: "0 Mbps",
    rxTraffic: "0 Mbps",
    txTraffic: "0 Mbps",
    degraded: true,
  },
}

export const routerInterfacesById: Record<string, InterfaceStatus[]> = {
  r1: [
    { name: "eth0", status: "up", rx: "120 Mbps", tx: "90 Mbps", rxMbps: 120, txMbps: 90 },
    { name: "eth1", status: "up", rx: "80 Mbps", tx: "70 Mbps", rxMbps: 80, txMbps: 70 },
  ],
  r2: [
    { name: "eth0", status: "down", rx: "0 Mbps", tx: "0 Mbps", rxMbps: 0, txMbps: 0 },
  ],
}

export const clientsMap: ClientMapItem[] = [
  {
    id: "1",
    name: "Mariana Torres",
    document: "CC-102030",
    phone: "+57 300 123 4567",
    plan: "Fiber 200",
    status: "active",
    technicianName: "Jorge Ruiz",
    zone: "North",
    zoneSource: "visit",
    latitude: 4.711,
    longitude: -74.0721,
  },
  {
    id: "2",
    name: "Carlos Rojas",
    document: "CC-405060",
    phone: "+57 301 555 1111",
    plan: "Home 50",
    status: "suspended",
    technicianName: "Sara V\u00e9lez",
    zone: "West",
    zoneSource: "address",
    latitude: 4.67,
    longitude: -74.1,
  },
  {
    id: "3",
    name: "Laura G\u00f3mez",
    document: "CC-708090",
    phone: "+57 302 888 2222",
    plan: "Business 500",
    status: "inactive",
    technicianName: "Jorge Ruiz",
    zone: "South",
    zoneSource: "fallback",
    latitude: 4.74,
    longitude: -74.03,
  },
]

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    clientId: "1",
    clientName: "Mariana Torres",
    invoiceNumber: "INV-2024-001",
    amount: 59.99,
    issueDate: "2024-09-30",
    dueDate: "2024-10-10",
    status: "paid",
  },
  {
    id: "inv-2",
    clientId: "2",
    clientName: "Carlos Rojas",
    invoiceNumber: "INV-2024-002",
    amount: 29.99,
    issueDate: "2024-09-30",
    dueDate: "2024-10-12",
    status: "pending",
  },
  {
    id: "inv-3",
    clientId: "3",
    clientName: "Laura G\u00f3mez",
    invoiceNumber: "INV-2024-003",
    amount: 149.99,
    issueDate: "2024-09-25",
    dueDate: "2024-10-05",
    status: "overdue",
  },
]

export const reportMetrics: ReportMetrics = {
  totalRevenue: 239.97,
  totalPending: 29.99,
  totalOverdue: 149.99,
  totalPaid: 59.99,
}

export const revenueData: RevenueData[] = [
  { date: "2024-09-25", amount: 149.99 },
  { date: "2024-09-30", amount: 89.98 },
  { date: "2024-10-03", amount: 59.99 },
]

export const statusDistribution: StatusDistribution[] = [
  { status: "pending", count: 1 },
  { status: "paid", count: 1 },
  { status: "overdue", count: 1 },
]

export const overdueClients: OverdueClient[] = [
  { id: "3", name: "Laura G\u00f3mez", amountDue: 149.99, daysOverdue: 12 },
]

export const clientPortalProfile: ClientProfile = {
  id: "1",
  name: "Mariana Torres",
  email: "mariana.torres@example.com",
  plan: "Fiber 200",
  status: "active",
  ipAddress: "192.168.10.23",
  serviceAddress: "Av. Central 123, Bogota",
  accountNumber: "ACC-102030",
  balance: 59.99,
  openTickets: 1,
  nextDueDate: "2024-10-10",
  lastPaymentDate: "2024-10-03",
  lastAccessAt: "2024-10-15 09:45",
  serviceStatus: "online",
}

export const clientPortalInvoices: ClientInvoice[] = [
  {
    id: "cp-inv-1",
    invoiceNumber: "INV-2024-001",
    amount: 59.99,
    dueDate: "2024-10-10",
    status: "paid",
    issueDate: "2024-09-30",
    period: "Sep 2024",
    paidAt: "2024-10-03",
  },
  {
    id: "cp-inv-2",
    invoiceNumber: "INV-2024-004",
    amount: 59.99,
    dueDate: "2024-11-10",
    status: "pending",
    issueDate: "2024-10-31",
    period: "Oct 2024",
  },
]

export const installations: Installation[] = [
  {
    id: "inst-1",
    clientId: "1",
    clientName: "Mariana Torres",
    clientPhone: "+57 300 123 4567",
    clientAddress: "Av. Central 123",
    clientStatus: "active",
    clientPlan: "Fiber 200",
    visitId: "v1",
    visitType: "installation",
    visitStatus: "completed",
    visitScheduledAt: "2024-10-06T10:30:00.000Z",
    routerId: "r1",
    routerName: "Core Router",
    routerIp: "10.0.0.1",
    routerZone: "Centro",
    routerLocation: "Data Center",
    routerStatus: "online",
    operationType: "installation",
    status: "installed",
    installedAt: "2024-10-06T11:15:00.000Z",
    notes: "Instalacion completada y probada.",
    createdAt: "2024-10-06T11:15:00.000Z",
    updatedAt: "2024-10-06T11:15:00.000Z",
  },
  {
    id: "inst-2",
    clientId: "3",
    clientName: "Laura Gómez",
    clientPhone: "+57 302 888 2222",
    clientAddress: "Carrera 8 #90-12",
    clientStatus: "inactive",
    clientPlan: "Business 500",
    visitId: "v2",
    visitType: "installation",
    visitStatus: "in_progress",
    visitScheduledAt: "2024-10-07T14:00:00.000Z",
    routerId: "r2",
    routerName: "Edge Router",
    routerIp: "10.0.1.1",
    routerZone: "Sur",
    routerLocation: "North POP",
    routerStatus: "offline",
    operationType: "relocation",
    status: "scheduled",
    installedAt: null,
    notes: "Pendiente de activacion final.",
    createdAt: "2024-10-07T14:00:00.000Z",
    updatedAt: "2024-10-07T14:00:00.000Z",
  },
]

export const installationMovements: InstallationMovement[] = [
  {
    id: "mov-1",
    clientId: "1",
    clientName: "Mariana Torres",
    clientPhone: "+57 300 123 4567",
    clientAddress: "Av. Central 123",
    clientStatus: "active",
    clientPlan: "Fiber 200",
    installationId: "inst-1",
    visitId: "v1",
    visitType: "support",
    visitStatus: "completed",
    visitScheduledAt: "2024-10-06T10:30:00.000Z",
    routerId: "r1",
    routerName: "Core Router",
    routerIp: "10.0.0.1",
    routerZone: "Centro",
    routerLocation: "Data Center",
    routerStatus: "online",
    operationType: "installation",
    status: "installed",
    notes: "Instalacion inicial completada.",
    happenedAt: "2024-10-06T11:15:00.000Z",
    createdAt: "2024-10-06T11:15:00.000Z",
  },
  {
    id: "mov-2",
    clientId: "1",
    clientName: "Mariana Torres",
    clientPhone: "+57 300 123 4567",
    clientAddress: "Av. Central 123",
    clientStatus: "active",
    clientPlan: "Fiber 200",
    installationId: "inst-1",
    visitId: "v1",
    visitType: "support",
    visitStatus: "completed",
    visitScheduledAt: "2024-10-06T10:30:00.000Z",
    routerId: "r2",
    routerName: "Edge Router",
    routerIp: "10.0.1.1",
    routerZone: "Norte",
    routerLocation: "North POP",
    routerStatus: "offline",
    operationType: "relocation",
    status: "scheduled",
    notes: "Movimiento posterior de reubicacion.",
    happenedAt: "2024-11-10T15:20:00.000Z",
    createdAt: "2024-11-10T15:20:00.000Z",
  },
]

export const clientPortalPayments: ClientPayment[] = [
  {
    id: "cp-pay-1",
    amount: 59.99,
    paymentDate: "2024-10-03",
    method: "card",
    status: "paid",
    invoiceNumber: "INV-2024-001",
    reference: "TRX-8192",
  },
]

export const clientPortalTickets: ClientTicket[] = [
  {
    id: "cp-t1",
    title: "Slow speed at night",
    status: "open",
    createdAt: "2024-10-01",
    priority: "high",
    updatedAt: "2024-10-02",
    channel: "web",
    messageCount: 3,
  },
]

export const managedRouters: ManagedRouter[] = [
  {
    id: "router-1",
    name: "Core Router",
    ip: "10.0.0.1",
    port: 8728,
    username: "admin",
    passwordMasked: "********",
    zone: "Centro",
    location: "Data Center",
    latitude: 4.65,
    longitude: -74.06,
    status: "online",
    lastCheckedAt: new Date().toISOString(),
  },
  {
    id: "router-2",
    name: "Edge Router North",
    ip: "10.0.1.1",
    port: 8728,
    username: "netops",
    passwordMasked: "********",
    zone: "Norte",
    location: "North POP",
    latitude: 4.73,
    longitude: -74.03,
    status: "offline",
    lastCheckedAt: new Date().toISOString(),
  },
]

export const routerHealthById: Record<string, RouterHealth> = {
  "router-1": {
    cpuUsage: 41,
    ramUsage: 63,
    uptime: "24d 11h",
    interfacesUp: 8,
    interfacesDown: 1,
    throughput: "1.8 Gbps",
  },
  "router-2": {
    cpuUsage: 0,
    ramUsage: 0,
    uptime: "0d 0h",
    interfacesUp: 0,
    interfacesDown: 9,
    throughput: "0 Mbps",
  },
}

export const systemSettings: SystemSettings = {
  companyName: "Corma Networks S.A.S.",
  tradeName: "Corma ISP",
  taxId: "901.234.567-8",
  billingEmail: "facturacion@corma.net",
  billingPhone: "+57 601 555 2200",
  address: "Av. 19 #102-33, Bogota",
  currency: "COP",
  timezone: "America/Bogota",
  invoicePrefix: "COR",
  logoUrl: "https://placehold.co/240x120/png?text=Corma+ISP",
  brandPrimaryColor: "#0f172a",
  brandSecondaryColor: "#e2e8f0",
  legalFooter: "Este documento es informativo y fue generado automaticamente desde la plataforma.",
}

export const documentTypes: DocumentTypeItem[] = [
  {
    id: "doc-cc",
    code: "CC",
    name: "Cedula de ciudadania",
    active: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "doc-ce",
    code: "CE",
    name: "Cedula de extranjeria",
    active: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "doc-ti",
    code: "TI",
    name: "Tarjeta de identidad",
    active: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "doc-nit",
    code: "NIT",
    name: "Numero de identificacion tributaria",
    active: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "doc-passport",
    code: "PASSPORT",
    name: "Pasaporte",
    active: true,
    isSystem: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
]

export const internalUsers: InternalUser[] = [
  {
    id: "iu-staff-1",
    name: "Laura Salgado",
    email: "laura.salgado@isp.local",
    documentType: "CC",
    documentNumber: "1023456789",
    phone: "+57 315 300 1001",
    role: "staff",
    status: "active",
    technicianProfile: null,
  },
  {
    id: "iu-admin-1",
    name: "Andres Mejia",
    email: "andres.mejia@isp.local",
    documentType: "CC",
    documentNumber: "79345612",
    phone: "+57 315 300 1002",
    role: "admin",
    status: "active",
    technicianProfile: null,
  },
  {
    id: "iu-support-1",
    name: "Paula Cardenas",
    email: "paula.cardenas@isp.local",
    documentType: "CC",
    documentNumber: "52789123",
    phone: "+57 315 300 1003",
    role: "support",
    status: "active",
    technicianProfile: null,
  },
  {
    id: "iu-tech-1",
    name: "Jorge Ruiz",
    email: "jorge.ruiz@isp.local",
    documentType: "CC",
    documentNumber: "91234567",
    phone: "+57 315 300 2001",
    role: "technician",
    status: "active",
    technicianProfile: {
      coverageZones: ["North", "Center"],
      skills: ["Fibra", "Empalmes", "Router"],
      availability: [
        { id: "mon-am", label: "Lunes 08:00-12:00", dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
        { id: "mon-pm", label: "Lunes 13:00-18:00", dayOfWeek: 1, startTime: "13:00", endTime: "18:00" },
        { id: "tue-am", label: "Martes 08:00-12:00", dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
        { id: "fri-am", label: "Viernes 08:00-12:00", dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
      ],
    },
  },
  {
    id: "iu-tech-2",
    name: "Sara Velez",
    email: "sara.velez@isp.local",
    documentType: "CC",
    documentNumber: "1002456789",
    phone: "+57 315 300 2002",
    role: "technician",
    status: "active",
    technicianProfile: {
      coverageZones: ["South", "West"],
      skills: ["Instalaciones", "Acometidas", "ONT"],
      availability: [
        { id: "tue-pm", label: "Martes 13:00-18:00", dayOfWeek: 2, startTime: "13:00", endTime: "18:00" },
        { id: "wed-am", label: "Miercoles 08:00-12:00", dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
        { id: "thu-am", label: "Jueves 08:00-12:00", dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
        { id: "sat-am", label: "Sabado 08:00-12:00", dayOfWeek: 6, startTime: "08:00", endTime: "12:00" },
      ],
    },
  },
  {
    id: "iu-tech-3",
    name: "Diego Romero",
    email: "diego.romero@isp.local",
    documentType: "CC",
    documentNumber: "88123455",
    phone: "+57 315 300 2003",
    role: "technician",
    status: "inactive",
    technicianProfile: {
      coverageZones: ["North"],
      skills: ["Soporte NOC", "Radioenlaces"],
      availability: [{ id: "wed-pm", label: "Miercoles 13:00-18:00", dayOfWeek: 3, startTime: "13:00", endTime: "18:00" }],
    },
  },
]



