import { useNavigate } from "react-router-dom"
import type { ClientMapItem } from "../types/clientMap"

interface ClientMapPopupProps {
  client: ClientMapItem
}

const ClientMapPopup = ({ client }: ClientMapPopupProps) => {
  const navigate = useNavigate()

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" }}>
      <strong>{client.name}</strong>
      <p style={{ margin: "6px 0", fontSize: 13, color: "#6b7280" }}>{client.document}</p>
      <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
        <span>Phone: {client.phone}</span>
        <span>Plan: {client.plan}</span>
        <span>Status: {client.status}</span>
        <span>Zone: {client.zone}</span>
        <span>Technician: {client.technicianName}</span>
      </div>
      <button
        type="button"
        style={{ marginTop: 10 }}
        onClick={() => navigate(`/clients/${client.id}/edit`)}
      >
        View Client
      </button>
    </div>
  )
}

export default ClientMapPopup
