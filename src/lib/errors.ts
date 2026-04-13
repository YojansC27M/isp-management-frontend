import { normalizeApiError } from "@/api/apiError"

export const getErrorMessage = (error: unknown, fallback = "Ocurrio un error inesperado.") => {
  return normalizeApiError(error, fallback).message
}
