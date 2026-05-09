import type { Permission, User } from "@/auth/types"
import type { ServerNavigationPayload } from "@/auth/navigationTypes"

export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthLoginResponse {
  accessToken: string
  tokenType: "Bearer"
  user: User
}

export interface AuthMeResponse extends User {
  permissions: Permission[]
}

export interface AuthRefreshMeResponse {
  user: AuthMeResponse
  navigation: ServerNavigationPayload
}
