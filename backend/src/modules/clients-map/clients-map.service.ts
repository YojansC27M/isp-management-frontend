import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"
import { ListClientsMapQueryDto } from "./dto/list-clients-map.query.dto"

interface ClientsMapItem {
  id: string
  name: string
  document: string
  phone: string
  plan: string
  status: "active" | "suspended" | "inactive"
  technicianName: string
  zone: string
  zoneSource: "visit" | "address" | "fallback"
  latitude: number
  longitude: number
}

const normalize = (value: string) => value.trim().toLowerCase()
const EARTH_RADIUS_KM = 6371

interface GeoPoint {
  lat: number
  lng: number
}

const deriveZone = (address: string | null) => {
  const normalized = (address ?? "").trim()
  if (!normalized) return "Zona general"
  const [firstChunk] = normalized.split(",")
  return firstChunk?.trim() || "Zona general"
}

const toRadians = (value: number) => (value * Math.PI) / 180

const distanceKm = (a: GeoPoint, b: GeoPoint) => {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine))
}

const parsePolygon = (raw: string | undefined) => {
  if (!raw?.trim()) return [] as GeoPoint[]
  const points = raw
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [latRaw, lngRaw] = chunk.split(",").map((v) => v.trim())
      const lat = Number(latRaw)
      const lng = Number(lngRaw)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    })
    .filter((point): point is GeoPoint => point !== null)
  return points.length >= 3 ? points : []
}

const pointInPolygon = (point: GeoPoint, polygon: GeoPoint[]) => {
  let inside = false
  const x = point.lng
  const y = point.lat

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.lng
    const yi = polygon[i]!.lat
    const xj = polygon[j]!.lng
    const yj = polygon[j]!.lat

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi
    if (intersects) inside = !inside
  }

  return inside
}

@Injectable()
export class ClientsMapService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListClientsMapQueryDto): Promise<ClientsMapItem[]> {
    const clients = await this.prisma.client.findMany({
      where: {
        status: query.status ?? undefined,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        document: true,
        phone: true,
        plan: {
          select: {
            name: true,
          },
        },
        status: true,
        address: true,
        latitude: true,
        longitude: true,
        visits: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            technicianName: true,
            zone: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    })

    const mapped = clients
      .filter((client): client is typeof client & { latitude: number; longitude: number } => {
        return typeof client.latitude === "number" && typeof client.longitude === "number"
      })
      .map<ClientsMapItem>((client) => {
        const latestVisit = client.visits[0]
        const visitZone = latestVisit?.zone?.trim() || ""
        const derivedAddressZone = deriveZone(client.address)
        const zone = visitZone || derivedAddressZone
        const zoneSource: ClientsMapItem["zoneSource"] = visitZone
          ? "visit"
          : client.address?.trim()
            ? "address"
            : "fallback"
        const technicianName = latestVisit?.technicianName?.trim() || "Sin asignar"
        const status = (client.status as ClientsMapItem["status"]) || "inactive"

        return {
          id: client.id,
          name: client.name,
          document: client.document ?? "",
          phone: client.phone ?? "",
          plan: client.plan?.name || "Sin plan",
          status,
          technicianName,
          zone,
          zoneSource,
          latitude: client.latitude,
          longitude: client.longitude,
        }
      })

    const normalizedZoneFilter = normalize(query.zone ?? "")
    const normalizedTechnicianFilter = normalize(query.technicianName ?? "")
    const hasRadiusFilter =
      Number.isFinite(query.centerLat) && Number.isFinite(query.centerLng) && Number.isFinite(query.radiusKm) && (query.radiusKm ?? 0) > 0
    const centerPoint: GeoPoint | null = hasRadiusFilter
      ? { lat: query.centerLat as number, lng: query.centerLng as number }
      : null
    const radiusKm = query.radiusKm ?? 0
    const polygon = parsePolygon(query.polygon)

    return mapped.filter((item) => {
      const zoneMatch = !normalizedZoneFilter || normalize(item.zone).includes(normalizedZoneFilter)
      const technicianMatch =
        !normalizedTechnicianFilter || normalize(item.technicianName).includes(normalizedTechnicianFilter)
      const radiusMatch = !centerPoint || distanceKm(centerPoint, { lat: item.latitude, lng: item.longitude }) <= radiusKm
      const polygonMatch = polygon.length < 3 || pointInPolygon({ lat: item.latitude, lng: item.longitude }, polygon)
      return zoneMatch && technicianMatch && radiusMatch && polygonMatch
    })
  }
}
