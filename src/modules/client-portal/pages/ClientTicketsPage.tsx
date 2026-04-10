import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { getErrorMessage } from "@/lib/errors"
import { clearClientToken } from "@/auth/session"
import ClientTicketsList from "../components/ClientTicketsList"
import { getTickets } from "../services/clientPortalApi"
import type { ClientTicket } from "../types/clientPortal"

const ClientTicketsPage = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<ClientTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getTickets()
      setTickets(data)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar tus tickets."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleLogout = () => {
    clearClientToken()
    navigate("/client/login")
  }

  return (
    <div className="grid gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tickets de soporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tus solicitudes de soporte recientes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/client/dashboard")}>
            Volver al panel
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </header>
      {loading ? (
        <StateMessage variant="loading" title="Cargando tickets..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar tickets" description={error} />
      ) : (
        <ClientTicketsList tickets={tickets} />
      )}
    </div>
  )
}

export default ClientTicketsPage


