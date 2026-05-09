import api from "@/api/axios"
import type { ServerNavigationPayload } from "@/auth/navigationTypes"

let inflightNavigationRequest: Promise<ServerNavigationPayload> | null = null

export const getNavigationConfig = async () => {
  if (inflightNavigationRequest) {
    return inflightNavigationRequest
  }

  inflightNavigationRequest = api
    .get<ServerNavigationPayload>("/auth/navigation", {
      skipRetry: true,
      cancelKey: "auth-navigation-bootstrap",
    })
    .then(({ data }) => data)
    .finally(() => {
      inflightNavigationRequest = null
    })

  return inflightNavigationRequest
}
