export type ClientMapStatus = "active" | "suspended" | "inactive"
export type GeoFilterMode = "" | "radius" | "polygon"

export interface ClientMapItem {
  id: string
  name: string
  document: string
  phone: string
  plan: string
  status: ClientMapStatus
  technicianName: string
  zone: string
  zoneSource: "visit" | "address" | "fallback"
  latitude: number
  longitude: number
}

export interface ClientMapFiltersValues {
  status: ClientMapStatus | ""
  zone: string
  technicianName: string
  geoMode: GeoFilterMode
  centerLat: string
  centerLng: string
  radiusKm: string
  polygon: string
}
