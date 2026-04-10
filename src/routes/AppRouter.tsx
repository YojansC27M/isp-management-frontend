import { Suspense, lazy, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"
import ProtectedRoute from "@/auth/ProtectedRoute"
import PermissionRoute from "@/auth/PermissionRoute"
import StateMessage from "@/components/feedback/StateMessage"
import { useEffect } from "react"
import { useUI } from "@/ui/uiContext"
import { getClientToken } from "@/auth/session"

const LoginPage = lazy(() => import("../pages/LoginPage"))
const DashboardPage = lazy(() => import("../pages/DashboardPage"))
const UnauthorizedPage = lazy(() => import("@/auth/UnauthorizedPage"))
const ClientsListPage = lazy(() => import("../modules/clients/pages/ClientsListPage"))
const ClientCreatePage = lazy(() => import("../modules/clients/pages/ClientCreatePage"))
const ClientEditPage = lazy(() => import("../modules/clients/pages/ClientEditPage"))
const PlansListPage = lazy(() => import("../modules/plans/pages/PlansListPage"))
const PlanCreatePage = lazy(() => import("../modules/plans/pages/PlanCreatePage"))
const PlanEditPage = lazy(() => import("../modules/plans/pages/PlanEditPage"))
const PaymentsListPage = lazy(() => import("../modules/payments/pages/PaymentsListPage"))
const PaymentCreatePage = lazy(() => import("../modules/payments/pages/PaymentCreatePage"))
const AccountStatusPage = lazy(() => import("../modules/payments/pages/AccountStatusPage"))
const TicketsListPage = lazy(() => import("../modules/tickets/pages/TicketsListPage"))
const TicketCreatePage = lazy(() => import("../modules/tickets/pages/TicketCreatePage"))
const TicketDetailPage = lazy(() => import("../modules/tickets/pages/TicketDetailPage"))
const VisitsCalendarPage = lazy(() => import("../modules/visits/pages/VisitsCalendarPage"))
const VisitCreatePage = lazy(() => import("../modules/visits/pages/VisitCreatePage"))
const VisitDetailPage = lazy(() => import("../modules/visits/pages/VisitDetailPage"))
const MonitoringDashboardPage = lazy(() => import("../modules/monitoring/pages/MonitoringDashboardPage"))
const ClientsMapPage = lazy(() => import("../modules/clients-map/pages/ClientsMapPage"))
const InvoicesListPage = lazy(() => import("../modules/invoices/pages/InvoicesListPage"))
const InvoiceDetailPage = lazy(() => import("../modules/invoices/pages/InvoiceDetailPage"))
const ReportsDashboardPage = lazy(() => import("../modules/reports/pages/ReportsDashboardPage"))
const AccessControlPage = lazy(() => import("../modules/access-control/pages/AccessControlPage"))
const SecurityAuditPage = lazy(() => import("../modules/security-audit/pages/SecurityAuditPage"))
const ClientLoginPage = lazy(() => import("../modules/client-portal/pages/ClientLoginPage"))
const ClientDashboardPage = lazy(() => import("../modules/client-portal/pages/ClientDashboardPage"))
const ClientPaymentsPage = lazy(() => import("../modules/client-portal/pages/ClientPaymentsPage"))
const ClientTicketsPage = lazy(() => import("../modules/client-portal/pages/ClientTicketsPage"))

const RouteFallback = () => (
  <div className="mx-auto w-full max-w-6xl px-6 py-8">
    <StateMessage variant="loading" title="Cargando módulo..." />
  </div>
)

const suspenseNode = (node: ReactNode) => <Suspense fallback={<RouteFallback />}>{node}</Suspense>

interface RouteToastState {
  title: string
  description?: string
  type?: "success" | "error" | "info"
}

const RouteStateNotifier = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useUI()

  useEffect(() => {
    const state = location.state as { toast?: RouteToastState } | null
    if (!state?.toast) return

    notify(state.toast)
    const nextState = { ...state }
    delete nextState.toast
    navigate(location.pathname, { replace: true, state: Object.keys(nextState).length > 0 ? nextState : null })
  }, [location.pathname, location.state, navigate, notify])

  return null
}

interface ClientProtectedRouteProps {
  children: ReactNode
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const clientToken = getClientToken()
  if (!clientToken) {
    return <Navigate to="/client/login" replace />
  }
  return <>{children}</>
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <RouteStateNotifier />
      <Routes>
        <Route path="/" element={suspenseNode(<LoginPage />)} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>{suspenseNode(<DashboardPage />)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PermissionRoute requiredPermissions={["clients.read"]}>
              <MainLayout>{suspenseNode(<ClientsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>{suspenseNode(<ClientCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>{suspenseNode(<ClientEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <PermissionRoute requiredPermissions={["plans.read"]}>
              <MainLayout>{suspenseNode(<PlansListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/new"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>{suspenseNode(<PlanCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>{suspenseNode(<PlanEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>{suspenseNode(<PaymentsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/new"
          element={
            <PermissionRoute requiredPermissions={["payments.write"]}>
              <MainLayout>{suspenseNode(<PaymentCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/account-status/:clientId"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>{suspenseNode(<AccountStatusPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>{suspenseNode(<TicketsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <PermissionRoute requiredPermissions={["tickets.write"]}>
              <MainLayout>{suspenseNode(<TicketCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>{suspenseNode(<TicketDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>{suspenseNode(<VisitsCalendarPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/new"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{suspenseNode(<VisitCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/:id"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>{suspenseNode(<VisitDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <PermissionRoute requiredPermissions={["monitoring.read"]}>
              <MainLayout>{suspenseNode(<MonitoringDashboardPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients-map"
          element={
            <PermissionRoute requiredPermissions={["clients_map.read"]}>
              <MainLayout>{suspenseNode(<ClientsMapPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>{suspenseNode(<InvoicesListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>{suspenseNode(<InvoiceDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PermissionRoute requiredPermissions={["reports.read"]}>
              <MainLayout>{suspenseNode(<ReportsDashboardPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/access-control"
          element={
            <PermissionRoute requiredPermissions={["roles.read"]}>
              <MainLayout>{suspenseNode(<AccessControlPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/security-audit"
          element={
            <PermissionRoute requiredPermissions={["audit.read"]}>
              <MainLayout>{suspenseNode(<SecurityAuditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route path="/unauthorized" element={suspenseNode(<UnauthorizedPage />)} />
        <Route path="/client/login" element={suspenseNode(<ClientLoginPage />)} />
        <Route
          path="/client/dashboard"
          element={
            <ClientProtectedRoute>{suspenseNode(<ClientDashboardPage />)}</ClientProtectedRoute>
          }
        />
        <Route
          path="/client/payments"
          element={
            <ClientProtectedRoute>{suspenseNode(<ClientPaymentsPage />)}</ClientProtectedRoute>
          }
        />
        <Route
          path="/client/tickets"
          element={
            <ClientProtectedRoute>{suspenseNode(<ClientTicketsPage />)}</ClientProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter


