export interface AuthenticatedUserPayload {
  sub: string
  jti: string
  iat?: number
  exp?: number
  email: string
  name: string
  roleKey: string
  clientId?: string
  permissions: string[]
}

export interface AuthRequestContext {
  ip?: string
  userAgent?: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: "Bearer"
  expiresAt: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
  }
}

export interface AuthRefreshResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
  }
  navigation: {
    modules: Array<{
      id: string
      items?: string[]
    }>
  }
}
