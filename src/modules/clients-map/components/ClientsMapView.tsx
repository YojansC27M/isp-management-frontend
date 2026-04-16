import { useMemo, useState } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet"
import { useI18n } from "@/i18n/i18nContext"
import { cn } from "@/lib/utils"
import ClientMapPopup from "./ClientMapPopup"
import type { ClientMapItem, ClientMapStatus } from "../types/clientMap"

interface ClientsMapViewProps {
  clients: ClientMapItem[]
}

const markerColors: Record<ClientMapStatus, string> = {
  active: "#16a34a",
  suspended: "#d97706",
  inactive: "#64748b",
}

const ClientsMapView = ({ clients }: ClientsMapViewProps) => {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedClient = useMemo(() => clients.find((client) => client.id === selectedId) ?? null, [clients, selectedId])

  const center = useMemo<[number, number]>(() => {
    if (clients.length === 0) return [4.711, -74.0721]
    const lat = clients.reduce((sum, client) => sum + client.latitude, 0) / clients.length
    const lng = clients.reduce((sum, client) => sum + client.longitude, 0) / clients.length
    return [lat, lng]
  }, [clients])

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-[460px]">
          <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clients.map((client) => (
              <CircleMarker
                key={client.id}
                center={[client.latitude, client.longitude]}
                radius={8}
                pathOptions={{ color: markerColors[client.status], fillOpacity: 0.85 }}
                eventHandlers={{ click: () => setSelectedId(client.id) }}
              >
                <Popup>
                  <div className="grid gap-1">
                    <strong>{client.name}</strong>
                    <span className="text-xs text-muted-foreground">
                      {t("clientsMap.popup.plan")}: {client.plan}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("clientsMap.popup.zone")}: {client.zone}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("clientsMap.popup.status")}: {t(`clients.status.${client.status}`)}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clients.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => setSelectedId(client.id)}
            className={cn(
              "grid gap-2 rounded-xl border bg-card p-3 text-left transition hover:border-border",
              selectedId === client.id ? "border-sky-500 ring-2 ring-sky-100" : "border-border",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: markerColors[client.status] }} />
              <strong className="text-sm text-foreground">{client.name}</strong>
            </div>
            <div className="text-xs text-muted-foreground">{client.zone}</div>
            <div className="text-xs text-muted-foreground">{t(`clients.status.${client.status}`)}</div>
          </button>
        ))}
      </section>

      {selectedClient && <ClientMapPopup client={selectedClient} />}
    </div>
  )
}

export default ClientsMapView
