import axios from "axios"

export const getErrorMessage = (error: unknown, fallback = "Ocurrio un error inesperado.") => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | string | undefined
    if (typeof data === "string" && data.trim()) return data
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string" && data.message.trim()) {
      return data.message
    }
    if (error.message?.trim()) return error.message
    return fallback
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}
