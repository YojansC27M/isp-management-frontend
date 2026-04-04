import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import ClientTicketsList from "../components/ClientTicketsList"
import { getTickets } from "../services/clientPortalApi"
import type { ClientTicket } from "../types/clientPortal"

const ClientTicketsPage = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [tickets, setTickets] = useState<ClientTicket[]>([])
  const [loading, setLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTickets()
      setTickets(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleLogout = () => {
    localStorage.removeItem("client_token")
    logout()
    navigate("/client/login")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Tickets de soporte</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Tus solicitudes de soporte recientes.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => navigate("/client/dashboard")}>
            Volver al Panel
          </button>
          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {loading ? <p>Cargando tickets...</p> : <ClientTicketsList tickets={tickets} />}
    </div>
  )
}

export default ClientTicketsPage
