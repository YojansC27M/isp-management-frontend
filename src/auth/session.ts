const AUTH_TOKEN_KEY = "auth_token"
const CLIENT_TOKEN_KEY = "client_token"

const isBrowser = () => typeof window !== "undefined" && typeof sessionStorage !== "undefined"

const readToken = (key: string) => {
  if (!isBrowser()) return null
  const token = sessionStorage.getItem(key)
  if (!token) return null
  const normalized = token.trim()
  return normalized.length > 0 ? normalized : null
}

const writeToken = (key: string, token: string) => {
  if (!isBrowser()) return
  const normalized = token.trim()
  if (!normalized) return
  sessionStorage.setItem(key, normalized)
}

const clearToken = (key: string) => {
  if (!isBrowser()) return
  sessionStorage.removeItem(key)
}

export const getAuthToken = () => readToken(AUTH_TOKEN_KEY)
export const setAuthToken = (token: string) => writeToken(AUTH_TOKEN_KEY, token)
export const clearAuthToken = () => clearToken(AUTH_TOKEN_KEY)

export const getClientToken = () => readToken(CLIENT_TOKEN_KEY)
export const setClientToken = (token: string) => writeToken(CLIENT_TOKEN_KEY, token)
export const clearClientToken = () => clearToken(CLIENT_TOKEN_KEY)
