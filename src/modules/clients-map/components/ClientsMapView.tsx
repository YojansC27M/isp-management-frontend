import { useMemo, useState } from "react"
import ClientMapPopup from "./ClientMapPopup"
import type { ClientMapItem, ClientMapStatus } from "../types/clientMap"

interface ClientsMapViewProps {
  clients: ClientMapItem[]
}

const markerColors: Record<ClientMapStatus, string> = {
  active: "#22c55e",
  suspended: "#f59e0b",
  inactive: "#9ca3af",
}

const ClientsMapView = ({ clients }: ClientsMapViewProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) ?? null,
    [clients, selectedId],
  )

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          height: 380,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#94a3b8" }}>
          Map placeholder (Leaflet not installed)
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedId(client.id)}
            style={{
              textAlign: "left",
              border: selectedId === client.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              background: "#fff",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: markerColors[client.status],
                }}
              />
              <strong>{client.name}</strong>
            </div>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{client.zone}</span>
          </button>
        ))}
      </div>

      {selectedClient && <ClientMapPopup client={selectedClient} />}
    </div>
  )
}

export default ClientsMapView
