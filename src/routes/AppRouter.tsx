import { type ReactNode, useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"
import ProtectedRoute from "@/auth/ProtectedRoute"
import PermissionRoute from "@/auth/PermissionRoute"
import AuthBootstrap from "@/auth/components/AuthBootstrap"
import NavigationBootstrap from "@/auth/components/NavigationBootstrap"
import { useUI } from "@/ui/uiContext"
import { getAuthToken, getClientToken } from "@/auth/session"
import { useAuthStore } from "@/store/authStore"
import RouteBoundary from "./RouteBoundary"
import UnauthorizedPage from "@/auth/UnauthorizedPage"
import ProfilePage from "../modules/account/pages/ProfilePage"
import PasswordSecurityPage from "../modules/account/pages/PasswordSecurityPage"
import AccessControlPage from "../modules/access-control/pages/AccessControlPage"
import ClientDashboardPage from "../modules/client-portal/pages/ClientDashboardPage"
import ClientChangePasswordPage from "../modules/client-portal/pages/ClientChangePasswordPage"
import ClientLoginPage from "../modules/client-portal/pages/ClientLoginPage"
import ClientPaymentsPage from "../modules/client-portal/pages/ClientPaymentsPage"
import ClientTicketsPage from "../modules/client-portal/pages/ClientTicketsPage"
import ClientsMapPage from "../modules/clients-map/pages/ClientsMapPage"
import ClientCreatePage from "../modules/clients/pages/ClientCreatePage"
import ClientDetailPage from "../modules/clients/pages/ClientDetailPage"
import ClientEditPage from "../modules/clients/pages/ClientEditPage"
import ClientsListPage from "../modules/clients/pages/ClientsListPage"
import InternalUserCreatePage from "../modules/internal-users/pages/InternalUserCreatePage"
import InternalUserEditPage from "../modules/internal-users/pages/InternalUserEditPage"
import InternalUsersListPage from "../modules/internal-users/pages/InternalUsersListPage"
import InvoiceCancelPage from "../modules/invoices/pages/InvoiceCancelPage"
import InvoiceCreatePage from "../modules/invoices/pages/InvoiceCreatePage"
import InvoiceDetailPage from "../modules/invoices/pages/InvoiceDetailPage"
import InvoiceEditPage from "../modules/invoices/pages/InvoiceEditPage"
import InvoicesListPage from "../modules/invoices/pages/InvoicesListPage"
import MonitoringDashboardPage from "../modules/monitoring/pages/MonitoringDashboardPage"
import NocPage from "../modules/operations/pages/NocPage"
import AccountStatusPage from "../modules/payments/pages/AccountStatusPage"
import PaymentCreatePage from "../modules/payments/pages/PaymentCreatePage"
import PaymentDetailPage from "../modules/payments/pages/PaymentDetailPage"
import PaymentEditPage from "../modules/payments/pages/PaymentEditPage"
import PaymentsListPage from "../modules/payments/pages/PaymentsListPage"
import PlanCreatePage from "../modules/plans/pages/PlanCreatePage"
import PlanEditPage from "../modules/plans/pages/PlanEditPage"
import PlansListPage from "../modules/plans/pages/PlansListPage"
import ReportsDashboardPage from "../modules/reports/pages/ReportsDashboardPage"
import InstallationCreatePage from "../modules/installations/pages/InstallationCreatePage"
import InstallationEditPage from "../modules/installations/pages/InstallationEditPage"
import InstallationsListPage from "../modules/installations/pages/InstallationsListPage"
import RouterCreatePage from "../modules/routers/pages/RouterCreatePage"
import RouterDetailPage from "../modules/routers/pages/RouterDetailPage"
import RoutersListPage from "../modules/routers/pages/RoutersListPage"
import SecurityAuditPage from "../modules/security-audit/pages/SecurityAuditPage"
import DocumentTypesPage from "../modules/system-settings/pages/DocumentTypesPage"
import SystemSettingsPage from "../modules/system-settings/pages/SystemSettingsPage"
import SupportOverviewPage from "../modules/support/pages/SupportOverviewPage"
import TicketCreatePage from "../modules/tickets/pages/TicketCreatePage"
import TicketDetailPage from "../modules/tickets/pages/TicketDetailPage"
import TicketEditPage from "../modules/tickets/pages/TicketEditPage"
import TicketsListPage from "../modules/tickets/pages/TicketsListPage"
import VisitCreatePage from "../modules/visits/pages/VisitCreatePage"
import VisitDetailPage from "../modules/visits/pages/VisitDetailPage"
import VisitEditPage from "../modules/visits/pages/VisitEditPage"
import VisitReschedulePage from "../modules/visits/pages/VisitReschedulePage"
import VisitsCalendarPage from "../modules/visits/pages/VisitsCalendarPage"
import DashboardPage from "../pages/DashboardPage"
import LoginPage from "../pages/LoginPage"

const routeNode = (node: ReactNode) => <RouteBoundary>{node}</RouteBoundary>

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

const RootRoute = () => {
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return routeNode(<LoginPage />)
}

const AppRouter = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthBootstrap />
      <NavigationBootstrap />
      <RouteStateNotifier />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route
          path="/dashboard"
          element={
            <PermissionRoute requiredPermissions={["dashboard.read"]}>
              <MainLayout>{routeNode(<DashboardPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/account/profile"
          element={
            <ProtectedRoute>
              <MainLayout>{routeNode(<ProfilePage />)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/security"
          element={
            <ProtectedRoute>
              <MainLayout>{routeNode(<PasswordSecurityPage />)}</MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal-users"
          element={
            <PermissionRoute requiredPermissions={["internal_users.read"]}>
              <MainLayout>{routeNode(<InternalUsersListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/internal-users/new"
          element={
            <PermissionRoute requiredPermissions={["internal_users.write"]}>
              <MainLayout>{routeNode(<InternalUserCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/internal-users/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["internal_users.write"]}>
              <MainLayout>{routeNode(<InternalUserEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PermissionRoute requiredPermissions={["clients.read"]}>
              <MainLayout>{routeNode(<ClientsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <PermissionRoute requiredPermissions={["clients.read"]}>
              <MainLayout>{routeNode(<ClientDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>{routeNode(<ClientCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>{routeNode(<ClientEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <PermissionRoute requiredPermissions={["plans.read"]}>
              <MainLayout>{routeNode(<PlansListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/new"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>{routeNode(<PlanCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>{routeNode(<PlanEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>{routeNode(<PaymentsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/detail/:id"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>{routeNode(<PaymentDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/detail/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["payments.manual.write"]}>
              <MainLayout>{routeNode(<PaymentEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/new"
          element={
            <PermissionRoute requiredPermissions={["payments.manual.write"]}>
              <MainLayout>{routeNode(<PaymentCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/account-status/:clientId"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>{routeNode(<AccountStatusPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/support/overview"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>{routeNode(<SupportOverviewPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>{routeNode(<TicketsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <PermissionRoute requiredPermissions={["tickets.write"]}>
              <MainLayout>{routeNode(<TicketCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>{routeNode(<TicketDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["tickets.write"]}>
              <MainLayout>{routeNode(<TicketEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>{routeNode(<VisitsCalendarPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/new"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{routeNode(<VisitCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/:id"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>{routeNode(<VisitDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{routeNode(<VisitEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/:id/reschedule"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{routeNode(<VisitReschedulePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/installations"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>{routeNode(<InstallationsListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/installations/new"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{routeNode(<InstallationCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/installations/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>{routeNode(<InstallationEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/operations/noc"
          element={
            <PermissionRoute requiredPermissions={["routers.read", "monitoring.read"]}>
              <MainLayout>{routeNode(<NocPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <PermissionRoute requiredPermissions={["monitoring.read"]}>
              <MainLayout>{routeNode(<MonitoringDashboardPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients-map"
          element={
            <PermissionRoute requiredPermissions={["clients_map.read"]}>
              <MainLayout>{routeNode(<ClientsMapPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>{routeNode(<InvoicesListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <PermissionRoute requiredPermissions={["invoices.write"]}>
              <MainLayout>{routeNode(<InvoiceCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>{routeNode(<InvoiceDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["invoices.write"]}>
              <MainLayout>{routeNode(<InvoiceEditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/:id/cancel"
          element={
            <PermissionRoute requiredPermissions={["invoices.write"]}>
              <MainLayout>{routeNode(<InvoiceCancelPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PermissionRoute requiredPermissions={["reports.read"]}>
              <MainLayout>{routeNode(<ReportsDashboardPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/routers"
          element={
            <PermissionRoute requiredPermissions={["routers.read"]}>
              <MainLayout>{routeNode(<RoutersListPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/routers/new"
          element={
            <PermissionRoute requiredPermissions={["routers.write"]}>
              <MainLayout>{routeNode(<RouterCreatePage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/routers/:id"
          element={
            <PermissionRoute requiredPermissions={["routers.read"]}>
              <MainLayout>{routeNode(<RouterDetailPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/access-control"
          element={
            <PermissionRoute requiredPermissions={["roles.read"]}>
              <MainLayout>{routeNode(<AccessControlPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/settings/system"
          element={
            <PermissionRoute requiredPermissions={["system_settings.read"]}>
              <MainLayout>{routeNode(<SystemSettingsPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/settings/document-types"
          element={
            <PermissionRoute requiredPermissions={["system_settings.read"]}>
              <MainLayout>{routeNode(<DocumentTypesPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/security-audit"
          element={
            <PermissionRoute requiredPermissions={["audit.read"]}>
              <MainLayout>{routeNode(<SecurityAuditPage />)}</MainLayout>
            </PermissionRoute>
          }
        />
        <Route path="/unauthorized" element={routeNode(<UnauthorizedPage />)} />
        <Route path="/client/login" element={routeNode(<ClientLoginPage />)} />
        <Route
          path="/client/change-password"
          element={
            <ClientProtectedRoute>{routeNode(<ClientChangePasswordPage />)}</ClientProtectedRoute>
          }
        />
        <Route
          path="/client/dashboard"
          element={
            <ClientProtectedRoute>{routeNode(<ClientDashboardPage />)}</ClientProtectedRoute>
          }
        />
        <Route
          path="/client/payments"
          element={
            <ClientProtectedRoute>{routeNode(<ClientPaymentsPage />)}</ClientProtectedRoute>
          }
        />
        <Route
          path="/client/tickets"
          element={
            <ClientProtectedRoute>{routeNode(<ClientTicketsPage />)}</ClientProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter



