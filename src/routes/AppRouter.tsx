import { BrowserRouter, Route, Routes } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import DashboardPage from "../pages/DashboardPage"
import MainLayout from "../layouts/MainLayout"
import ClientsListPage from "../modules/clients/pages/ClientsListPage"
import ClientCreatePage from "../modules/clients/pages/ClientCreatePage"
import ClientEditPage from "../modules/clients/pages/ClientEditPage"

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
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
