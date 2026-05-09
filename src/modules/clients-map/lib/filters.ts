import type { ClientMapFiltersValues, ClientMapStatus, GeoFilterMode } from "../types/clientMap"

const validStatuses = new Set<ClientMapStatus>(["active", "suspended", "inactive"])
const validGeoModes = new Set<GeoFilterMode>(["", "radius", "polygon"])

const clampText = (value: string, maxLength: number) => value.trim().slice(0, maxLength)

const toNumber = (value: string) => {
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

const parsePolygonPoints = (rawPolygon: string) =>
  rawPolygon
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [latRaw = "", lngRaw = ""] = chunk.split(",")
      const lat = toNumber(latRaw)
      const lng = toNumber(lngRaw)
      return lat === null || lng === null ? null : { lat, lng }
    })
    .filter((point): point is { lat: number; lng: number } => point !== null)

export const normalizeClientMapFilters = (filters: ClientMapFiltersValues): ClientMapFiltersValues => {
  const normalizedStatus = validStatuses.has(filters.status as ClientMapStatus) ? filters.status : ""
  const normalizedGeoMode = validGeoModes.has(filters.geoMode) ? filters.geoMode : ""

  return {
    status: normalizedStatus,
    zone: clampText(filters.zone, 120),
    technicianName: clampText(filters.technicianName, 120),
    geoMode: normalizedGeoMode,
    centerLat: filters.centerLat.trim(),
    centerLng: filters.centerLng.trim(),
    radiusKm: filters.radiusKm.trim(),
    polygon: filters.polygon.trim().slice(0, 4000),
  }
}

export const validateClientMapFilters = (
  filters: ClientMapFiltersValues,
  t: (key: string) => string,
) => {
  const errors: string[] = []

  if (filters.zone.length > 120) errors.push(t("clientsMap.validation.zoneLength"))
  if (filters.technicianName.length > 120) errors.push(t("clientsMap.validation.technicianLength"))
  if (filters.polygon.length > 4000) errors.push(t("clientsMap.validation.polygonLength"))

  if (filters.geoMode === "radius") {
    const lat = toNumber(filters.centerLat)
    const lng = toNumber(filters.centerLng)
    const radius = toNumber(filters.radiusKm)

    if (lat === null || lng === null || radius === null) {
      errors.push(t("clientsMap.validation.radiusRequired"))
    } else {
      if (lat < -90 || lat > 90) errors.push(t("clientsMap.validation.latitudeRange"))
      if (lng < -180 || lng > 180) errors.push(t("clientsMap.validation.longitudeRange"))
      if (radius < 0.05) errors.push(t("clientsMap.validation.radiusRange"))
    }
  }

  if (filters.geoMode === "polygon") {
    if (!filters.polygon) {
      errors.push(t("clientsMap.validation.polygonRequired"))
    } else {
      const polygonPoints = parsePolygonPoints(filters.polygon)
      if (polygonPoints.length < 3) {
        errors.push(t("clientsMap.validation.polygonPoints"))
      } else {
        const hasInvalidPoint = polygonPoints.some(
          (point) => point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180,
        )
        if (hasInvalidPoint) errors.push(t("clientsMap.validation.polygonRange"))
      }
    }
  }

  return errors
}

export const buildClientMapParams = (filters: ClientMapFiltersValues) => {
  const normalized = normalizeClientMapFilters(filters)
  const params: Record<string, string> = {}

  if (normalized.status) params.status = normalized.status
  if (normalized.zone) params.zone = normalized.zone
  if (normalized.technicianName) params.technicianName = normalized.technicianName

  if (normalized.geoMode === "radius") {
    if (normalized.centerLat) params.centerLat = normalized.centerLat
    if (normalized.centerLng) params.centerLng = normalized.centerLng
    if (normalized.radiusKm) params.radiusKm = normalized.radiusKm
  }

  if (normalized.geoMode === "polygon" && normalized.polygon) {
    params.polygon = normalized.polygon
  }

  return params
}
