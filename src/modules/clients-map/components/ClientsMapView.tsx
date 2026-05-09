import { useEffect, useMemo, useState } from "react"
import { latLngBounds } from "leaflet"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
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

const zoneSourceLabel: Record<ClientMapItem["zoneSource"], string> = {
  visit: "visita",
  address: "direccion",
  fallback: "general",
}

const hasValidCoordinates = (client: ClientMapItem) =>
  Number.isFinite(client.latitude) &&
  Number.isFinite(client.longitude) &&
  client.latitude >= -90 &&
  client.latitude <= 90 &&
  client.longitude >= -180 &&
  client.longitude <= 180

interface FitBoundsProps {
  clients: ClientMapItem[]
}

const FitBounds = ({ clients }: FitBoundsProps) => {
  const map = useMap()

  useEffect(() => {
    if (clients.length === 0) return
    if (clients.length === 1) {
      map.setView([clients[0]!.latitude, clients[0]!.longitude], 13)
      return
    }

    const bounds = latLngBounds(clients.map((client) => [client.latitude, client.longitude] as [number, number]))
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
  }, [clients, map])

  return null
}

const ClientsMapView = ({ clients }: ClientsMapViewProps) => {
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const safeClients = useMemo(() => clients.filter(hasValidCoordinates), [clients])

  const selectedClient = useMemo(() => safeClients.find((client) => client.id === selectedId) ?? null, [safeClients, selectedId])

  const center = useMemo<[number, number]>(() => {
    if (safeClients.length === 0) return [4.711, -74.0721]
    const lat = safeClients.reduce((sum, client) => sum + client.latitude, 0) / safeClients.length
    const lng = safeClients.reduce((sum, client) => sum + client.longitude, 0) / safeClients.length
    return [lat, lng]
  }, [safeClients])

  return (
    <div className="grid gap-4">
      <section className="relative z-0 isolate overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-[460px]">
          <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full !z-0">
            <FitBounds clients={safeClients} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {safeClients.map((client) => (
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
                      {t("clientsMap.popup.zone")}: {client.zone} ({zoneSourceLabel[client.zoneSource]})
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

      <section className="grid max-h-[420px] gap-3 overflow-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
        {safeClients.map((client) => (
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
