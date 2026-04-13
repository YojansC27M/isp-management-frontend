import axios from "axios"

export type ApiErrorCode =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "timeout"
  | "canceled"
  | "network"
  | "server"
  | "unknown"

export interface ApiError extends Error {
  isApiError: true
  code: ApiErrorCode
  status?: number
  isRetryable: boolean
  details?: unknown
  originalError: unknown
}

const extractMessageFromData = (data: unknown) => {
  if (typeof data === "string" && data.trim()) return data
  if (!data || typeof data !== "object") return null

  const maybeRecord = data as Record<string, unknown>
  const message = maybeRecord.message
  if (typeof message === "string" && message.trim()) return message
  return null
}

const buildApiError = ({
  code,
  message,
  status,
  isRetryable,
  details,
  originalError,
}: {
  code: ApiErrorCode
  message: string
  status?: number
  isRetryable: boolean
  details?: unknown
  originalError: unknown
}): ApiError => {
  const error = new Error(message) as ApiError
  error.name = "ApiError"
  error.isApiError = true
  error.code = code
  error.status = status
  error.isRetryable = isRetryable
  error.details = details
  error.originalError = originalError
  return error
}

export const isApiError = (error: unknown): error is ApiError => {
  return Boolean(error && typeof error === "object" && "isApiError" in error && (error as ApiError).isApiError)
}

export const normalizeApiError = (error: unknown, fallback = "Ocurrio un error inesperado."): ApiError => {
  if (isApiError(error)) return error

  if (axios.isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      return buildApiError({
        code: "canceled",
        message: "Solicitud cancelada.",
        isRetryable: false,
        originalError: error,
      })
    }

    const status = error.response?.status
    const data = error.response?.data
    const fromApi = extractMessageFromData(data)

    if (error.code === "ECONNABORTED") {
      return buildApiError({
        code: "timeout",
        message: fromApi ?? "La solicitud excedio el tiempo de espera.",
        status,
        isRetryable: true,
        details: data,
        originalError: error,
      })
    }

    if (!status) {
      return buildApiError({
        code: "network",
        message: fromApi ?? "No se pudo conectar con el servidor.",
        isRetryable: true,
        details: data,
        originalError: error,
      })
    }

    if (status === 400) {
      return buildApiError({
        code: "bad_request",
        message: fromApi ?? "La solicitud es invalida.",
        status,
        isRetryable: false,
        details: data,
        originalError: error,
      })
    }

    if (status === 401) {
      return buildApiError({
        code: "unauthorized",
        message: fromApi ?? "No autorizado.",
        status,
        isRetryable: false,
        details: data,
        originalError: error,
      })
    }

    if (status === 403) {
      return buildApiError({
        code: "forbidden",
        message: fromApi ?? "No tienes permisos para realizar esta accion.",
        status,
        isRetryable: false,
        details: data,
        originalError: error,
      })
    }

    if (status === 404) {
      return buildApiError({
        code: "not_found",
        message: fromApi ?? "No se encontro el recurso solicitado.",
        status,
        isRetryable: false,
        details: data,
        originalError: error,
      })
    }

    if (status === 409) {
      return buildApiError({
        code: "conflict",
        message: fromApi ?? "Conflicto al procesar la solicitud.",
        status,
        isRetryable: false,
        details: data,
        originalError: error,
      })
    }

    if (status === 429) {
      return buildApiError({
        code: "rate_limited",
        message: fromApi ?? "Demasiadas solicitudes. Intenta de nuevo en unos segundos.",
        status,
        isRetryable: true,
        details: data,
        originalError: error,
      })
    }

    if (status >= 500) {
      return buildApiError({
        code: "server",
        message: fromApi ?? "El servidor no pudo procesar la solicitud.",
        status,
        isRetryable: true,
        details: data,
        originalError: error,
      })
    }

    return buildApiError({
      code: "unknown",
      message: fromApi ?? (error.message || fallback),
      status,
      isRetryable: false,
      details: data,
      originalError: error,
    })
  }

  if (error instanceof Error && error.message.trim()) {
    return buildApiError({
      code: "unknown",
      message: error.message,
      isRetryable: false,
      originalError: error,
    })
  }

  return buildApiError({
    code: "unknown",
    message: fallback,
    isRetryable: false,
    originalError: error,
  })
}
