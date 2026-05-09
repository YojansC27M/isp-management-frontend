import { normalizeApiError } from "@/api/apiError"

export const getErrorMessage = (error: unknown, fallback = "Ocurrio un error inesperado.") => {
  const normalized = normalizeApiError(error, fallback)
  if (normalized.code === "canceled") return ""
  return normalized.message
}

const normalizeDetail = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const directMessage = record.message
  if (typeof directMessage === "string" && directMessage.trim()) return directMessage.trim()

  const constraints = record.constraints
  if (constraints && typeof constraints === "object" && !Array.isArray(constraints)) {
    const constraintValues = Object.values(constraints)
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
    if (constraintValues.length > 0) return constraintValues[0]
  }

  return null
}

export const getErrorDetails = (error: unknown, maxItems = 3) => {
  const normalized = normalizeApiError(error)
  const detailsSource = normalized.details
  const details =
    Array.isArray(detailsSource)
      ? detailsSource
      : detailsSource && typeof detailsSource === "object" && Array.isArray((detailsSource as Record<string, unknown>)["details"])
        ? ((detailsSource as Record<string, unknown>)["details"] as unknown[])
        : []

  const messages = details.map(normalizeDetail).filter((item): item is string => Boolean(item))
  const deduped = Array.from(new Set(messages))
  return deduped.slice(0, Math.max(1, maxItems))
}

export const getErrorDescription = (error: unknown, fallback = "Ocurrio un error inesperado.") => {
  if (normalizeApiError(error).code === "canceled") return ""
  const message = getErrorMessage(error, fallback)
  const details = getErrorDetails(error)

  if (details.length === 0) return message
  const extra = details.filter((detail) => detail.toLowerCase() !== message.toLowerCase())
  if (extra.length === 0) return message

  return `${message} Detalles: ${extra.join(" | ")}`
}
