import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import ClientSummaryCard from "../components/ClientSummaryCard"
import { getInvoices, getProfile, getTickets } from "../services/clientPortalApi"
import type { ClientInvoice, ClientProfile, ClientTicket } from "../types/clientPortal"

const ClientDashboardPage = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [invoices, setInvoices] = useState<ClientInvoice[]>([])
  const [tickets, setTickets] = useState<ClientTicket[]>([])
  const [loading, setLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [profileData, invoicesData, ticketsData] = await Promise.all([
        getProfile(),
        getInvoices(),
        getTickets(),
      ])
      setProfile(profileData)
      setInvoices(invoicesData)
      setTickets(ticketsData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleLogout = () => {
    localStorage.removeItem("client_token")
    logout()
    navigate("/client/login")
  }

  const invoiceSummary = useMemo(() => {
    const pending = invoices.filter((invoice) => invoice.status === "pending").length
    const paid = invoices.filter((invoice) => invoice.status === "paid").length
    return { pending, paid }
  }, [invoices])

  if (loading) {
    return <p>Cargando panel...</p>
  }

  if (!profile) {
    return <p>No se encontró el perfil del cliente.</p>
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1>Bienvenido, {profile.name}</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Resumen del portal de clientes</p>
        </div>
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>

      <ClientSummaryCard profile={profile} />

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <strong>Facturas</strong>
          <p style={{ marginTop: 6, color: "#6b7280" }}>Pendientes: {invoiceSummary.pending}</p>
          <p style={{ marginTop: 4, color: "#6b7280" }}>Pagadas: {invoiceSummary.paid}</p>
          <button type="button" onClick={() => navigate("/client/payments")}>
            Ver pagos
          </button>
        </div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <strong>Tickets</strong>
          <p style={{ marginTop: 6, color: "#6b7280" }}>Tickets abiertos: {tickets.length}</p>
          <button type="button" onClick={() => navigate("/client/tickets")}>
            Ver tickets
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientDashboardPage
