import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import DashboardPage from "../pages/DashboardPage"
import MainLayout from "../layouts/MainLayout"
import { useAuthStore } from "@/store/authStore"
import ProtectedRoute from "@/auth/ProtectedRoute"
import PermissionRoute from "@/auth/PermissionRoute"
import UnauthorizedPage from "@/auth/UnauthorizedPage"
import ClientsListPage from "../modules/clients/pages/ClientsListPage"
import ClientCreatePage from "../modules/clients/pages/ClientCreatePage"
import ClientEditPage from "../modules/clients/pages/ClientEditPage"
import PlansListPage from "../modules/plans/pages/PlansListPage"
import PlanCreatePage from "../modules/plans/pages/PlanCreatePage"
import PlanEditPage from "../modules/plans/pages/PlanEditPage"
import PaymentsListPage from "../modules/payments/pages/PaymentsListPage"
import PaymentCreatePage from "../modules/payments/pages/PaymentCreatePage"
import AccountStatusPage from "../modules/payments/pages/AccountStatusPage"
import TicketsListPage from "../modules/tickets/pages/TicketsListPage"
import TicketCreatePage from "../modules/tickets/pages/TicketCreatePage"
import TicketDetailPage from "../modules/tickets/pages/TicketDetailPage"
import VisitsCalendarPage from "../modules/visits/pages/VisitsCalendarPage"
import VisitCreatePage from "../modules/visits/pages/VisitCreatePage"
import VisitDetailPage from "../modules/visits/pages/VisitDetailPage"
import MonitoringDashboardPage from "../modules/monitoring/pages/MonitoringDashboardPage"
import ClientsMapPage from "../modules/clients-map/pages/ClientsMapPage"
import InvoicesListPage from "../modules/invoices/pages/InvoicesListPage"
import InvoiceDetailPage from "../modules/invoices/pages/InvoiceDetailPage"
import ReportsDashboardPage from "../modules/reports/pages/ReportsDashboardPage"
import ClientLoginPage from "../modules/client-portal/pages/ClientLoginPage"
import ClientDashboardPage from "../modules/client-portal/pages/ClientDashboardPage"
import ClientPaymentsPage from "../modules/client-portal/pages/ClientPaymentsPage"
import ClientTicketsPage from "../modules/client-portal/pages/ClientTicketsPage"

interface ClientProtectedRouteProps {
  children: JSX.Element
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const token = useAuthStore((state) => state.token) ?? localStorage.getItem("client_token")
  if (!token) {
    return <Navigate to="/client/login" replace />
  }
  return children
}

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <PermissionRoute requiredPermissions={["clients.read"]}>
              <MainLayout>
                <ClientsListPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/new"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>
                <ClientCreatePage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["clients.write"]}>
              <MainLayout>
                <ClientEditPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <PermissionRoute requiredPermissions={["plans.read"]}>
              <MainLayout>
                <PlansListPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/new"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>
                <PlanCreatePage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/plans/:id/edit"
          element={
            <PermissionRoute requiredPermissions={["plans.write"]}>
              <MainLayout>
                <PlanEditPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>
                <PaymentsListPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/new"
          element={
            <PermissionRoute requiredPermissions={["payments.write"]}>
              <MainLayout>
                <PaymentCreatePage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/payments/account-status/:clientId"
          element={
            <PermissionRoute requiredPermissions={["payments.read"]}>
              <MainLayout>
                <AccountStatusPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>
                <TicketsListPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <PermissionRoute requiredPermissions={["tickets.write"]}>
              <MainLayout>
                <TicketCreatePage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <PermissionRoute requiredPermissions={["tickets.read"]}>
              <MainLayout>
                <TicketDetailPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>
                <VisitsCalendarPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/new"
          element={
            <PermissionRoute requiredPermissions={["visits.write"]}>
              <MainLayout>
                <VisitCreatePage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/visits/:id"
          element={
            <PermissionRoute requiredPermissions={["visits.read"]}>
              <MainLayout>
                <VisitDetailPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <PermissionRoute requiredPermissions={["monitoring.read"]}>
              <MainLayout>
                <MonitoringDashboardPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/clients-map"
          element={
            <PermissionRoute requiredPermissions={["clients_map.read"]}>
              <MainLayout>
                <ClientsMapPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>
                <InvoicesListPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <PermissionRoute requiredPermissions={["invoices.read"]}>
              <MainLayout>
                <InvoiceDetailPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <PermissionRoute requiredPermissions={["reports.read"]}>
              <MainLayout>
                <ReportsDashboardPage />
              </MainLayout>
            </PermissionRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route
          path="/client/dashboard"
          element={
            <ClientProtectedRoute>
              <ClientDashboardPage />
            </ClientProtectedRoute>
          }
        />
        <Route
          path="/client/payments"
          element={
            <ClientProtectedRoute>
              <ClientPaymentsPage />
            </ClientProtectedRoute>
          }
        />
        <Route
          path="/client/tickets"
          element={
            <ClientProtectedRoute>
              <ClientTicketsPage />
            </ClientProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
