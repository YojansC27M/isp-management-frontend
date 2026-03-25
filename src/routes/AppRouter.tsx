import { BrowserRouter, Route, Routes } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import DashboardPage from "../pages/DashboardPage"
import MainLayout from "../layouts/MainLayout"
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

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          }
        />
        <Route
          path="/clients"
          element={
            <MainLayout>
              <ClientsListPage />
            </MainLayout>
          }
        />
        <Route
          path="/clients/new"
          element={
            <MainLayout>
              <ClientCreatePage />
            </MainLayout>
          }
        />
        <Route
          path="/clients/:id/edit"
          element={
            <MainLayout>
              <ClientEditPage />
            </MainLayout>
          }
        />
        <Route
          path="/plans"
          element={
            <MainLayout>
              <PlansListPage />
            </MainLayout>
          }
        />
        <Route
          path="/plans/new"
          element={
            <MainLayout>
              <PlanCreatePage />
            </MainLayout>
          }
        />
        <Route
          path="/plans/:id/edit"
          element={
            <MainLayout>
              <PlanEditPage />
            </MainLayout>
          }
        />
        <Route
          path="/payments"
          element={
            <MainLayout>
              <PaymentsListPage />
            </MainLayout>
          }
        />
        <Route
          path="/payments/new"
          element={
            <MainLayout>
              <PaymentCreatePage />
            </MainLayout>
          }
        />
        <Route
          path="/payments/account-status/:clientId"
          element={
            <MainLayout>
              <AccountStatusPage />
            </MainLayout>
          }
        />
        <Route
          path="/tickets"
          element={
            <MainLayout>
              <TicketsListPage />
            </MainLayout>
          }
        />
        <Route
          path="/tickets/new"
          element={
            <MainLayout>
              <TicketCreatePage />
            </MainLayout>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <MainLayout>
              <TicketDetailPage />
            </MainLayout>
          }
        />
        <Route
          path="/visits"
          element={
            <MainLayout>
              <VisitsCalendarPage />
            </MainLayout>
          }
        />
        <Route
          path="/visits/new"
          element={
            <MainLayout>
              <VisitCreatePage />
            </MainLayout>
          }
        />
        <Route
          path="/visits/:id"
          element={
            <MainLayout>
              <VisitDetailPage />
            </MainLayout>
          }
        />
        <Route
          path="/monitoring"
          element={
            <MainLayout>
              <MonitoringDashboardPage />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
