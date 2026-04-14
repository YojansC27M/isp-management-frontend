import api from "@/api/axios"
import type { ServerNavigationPayload } from "@/auth/navigationTypes"

export const getNavigationConfig = async () => {
  const { data } = await api.get<ServerNavigationPayload>("/auth/navigation", {
    skipRetry: true,
  })
  return data
}

