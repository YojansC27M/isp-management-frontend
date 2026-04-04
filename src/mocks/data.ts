import type { Client } from "@/modules/clients/types/client"
import type { ClientMapItem } from "@/modules/clients-map/types/clientMap"
import type { Invoice } from "@/modules/invoices/types/invoice"
import type { InterfaceStatus, Router, RouterMetrics } from "@/modules/monitoring/types/monitoring"
import type { Payment, AccountStatusItem } from "@/modules/payments/types/payment"
import type { Plan } from "@/modules/plans/types/plan"
import type { OverdueClient, ReportMetrics, RevenueData, StatusDistribution } from "@/modules/reports/types/report"
import type { Ticket, TicketComment } from "@/modules/tickets/types/ticket"
import type { Visit } from "@/modules/visits/types/visit"
import type { ClientInvoice, ClientPayment, ClientProfile, ClientTicket } from "@/modules/client-portal/types/clientPortal"

export const clients: Client[] = [
  {
    id: "1",
    name: "Mariana Torres",
    document: "CC-102030",
    address: "Av. Central 123",
    phone: "+57 300 123 4567",
    email: "mariana.torres@example.com",
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
    title: "Intermittent connection",
    description: "Internet drops every few minutes.",
    status: "open",
    priority: "high",
    category: "technical",
    createdAt: "2024-10-01",
  },
  {
    id: "t2",
    clientId: "2",
    clientName: "Carlos Rojas",
    title: "Billing question",
    description: "Invoice shows extra charges.",
    status: "in_progress",
    priority: "medium",
    category: "billing",
    createdAt: "2024-10-02",
  },
]

export const ticketComments: TicketComment[] = [
  {
    id: "c1",
    ticketId: "t1",
    message: "We are reviewing your modem logs.",
    createdAt: "2024-10-01T10:30:00Z",
    author: "Support Agent",
  },
]

export const visits: Visit[] = [
  {
    id: "v1",
    clientId: "1",
    clientName: "Mariana Torres",
    technicianId: "tech-1",
    technicianName: "Jorge Ruiz",
    zone: "North",
    type: "support",
    scheduledDate: "2024-10-06",
    scheduledTime: "10:30",
    status: "scheduled",
    notes: "Check router signal levels.",
  },
  {
    id: "v2",
    clientId: "3",
    clientName: "Laura G\u00f3mez",
    technicianId: "tech-2",
    technicianName: "Sara V\u00e9lez",
    zone: "South",
    type: "installation",
    scheduledDate: "2024-10-07",
    scheduledTime: "14:00",
    status: "in_progress",
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
    totalTraffic: "2.3 TB",
  },
  r2: {
    cpuUsage: 0,
    ramUsage: 0,
    uptime: "0d 0h",
    totalTraffic: "0 GB",
  },
}

export const routerInterfacesById: Record<string, InterfaceStatus[]> = {
  r1: [
    { name: "eth0", status: "up", rx: "120 Mbps", tx: "90 Mbps" },
    { name: "eth1", status: "up", rx: "80 Mbps", tx: "70 Mbps" },
  ],
  r2: [
    { name: "eth0", status: "down", rx: "0 Mbps", tx: "0 Mbps" },
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
}

export const clientPortalInvoices: ClientInvoice[] = [
  { id: "cp-inv-1", invoiceNumber: "INV-2024-001", amount: 59.99, dueDate: "2024-10-10", status: "paid" },
  { id: "cp-inv-2", invoiceNumber: "INV-2024-004", amount: 59.99, dueDate: "2024-11-10", status: "pending" },
]

export const clientPortalPayments: ClientPayment[] = [
  { id: "cp-pay-1", amount: 59.99, paymentDate: "2024-10-03", method: "card" },
]

export const clientPortalTickets: ClientTicket[] = [
  { id: "cp-t1", title: "Slow speed at night", status: "open", createdAt: "2024-10-01" },
]



