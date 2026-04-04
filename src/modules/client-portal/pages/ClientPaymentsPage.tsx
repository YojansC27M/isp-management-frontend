import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import ClientPaymentsTable from "../components/ClientPaymentsTable"
import { getPayments } from "../services/clientPortalApi"
import type { ClientPayment } from "../types/clientPortal"

const ClientPaymentsPage = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [payments, setPayments] = useState<ClientPayment[]>([])
  const [loading, setLoading] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPayments()
      setPayments(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleLogout = () => {
    localStorage.removeItem("client_token")
    logout()
    navigate("/client/login")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Pagos</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Tu historial de pagos.</p>
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

      {loading ? <p>Cargando pagos...</p> : <ClientPaymentsTable payments={payments} />}
    </div>
  )
}

export default ClientPaymentsPage
