import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { normalizeApiError } from "@/api/apiError"
import { getAuthToken, getClientToken } from "@/auth/session"
import { getCurrentLocale } from "@/i18n/locale"

type DomainName =
  | "auth"
  | "clients"
  | "plans"
  | "payments"
  | "invoices"
  | "tickets"
  | "visits"
  | "monitoring"
  | "dashboard"
  | "reports"
  | "routers"
  | "roles"
  | "audit"
  | "client-portal"
  | "default"

interface DomainPolicy {
  timeoutMs: number
  retries: number
  retryDelayMs: number
}

interface RequestMeta {
  retryCount: number
  domain: DomainName
  policy: DomainPolicy
  cancelMapKey?: string
  cancelController?: AbortController
}

interface ApiRequestConfig extends InternalAxiosRequestConfig {
  cancelKey?: string
  skipRetry?: boolean
  maxRetries?: number
  retryDelayMs?: number
  __meta?: RequestMeta
}

const domainPolicies: Record<DomainName, DomainPolicy> = {
  auth: { timeoutMs: 8_000, retries: 0, retryDelayMs: 200 },
  clients: { timeoutMs: 10_000, retries: 1, retryDelayMs: 300 },
  plans: { timeoutMs: 10_000, retries: 1, retryDelayMs: 300 },
  payments: { timeoutMs: 12_000, retries: 1, retryDelayMs: 350 },
  invoices: { timeoutMs: 12_000, retries: 1, retryDelayMs: 350 },
  tickets: { timeoutMs: 10_000, retries: 1, retryDelayMs: 300 },
  visits: { timeoutMs: 10_000, retries: 1, retryDelayMs: 300 },
  monitoring: { timeoutMs: 15_000, retries: 1, retryDelayMs: 400 },
  dashboard: { timeoutMs: 12_000, retries: 1, retryDelayMs: 350 },
  reports: { timeoutMs: 15_000, retries: 1, retryDelayMs: 400 },
  routers: { timeoutMs: 12_000, retries: 1, retryDelayMs: 350 },
  roles: { timeoutMs: 10_000, retries: 0, retryDelayMs: 250 },
  audit: { timeoutMs: 10_000, retries: 0, retryDelayMs: 250 },
  "client-portal": { timeoutMs: 8_000, retries: 0, retryDelayMs: 200 },
  default: { timeoutMs: 10_000, retries: 1, retryDelayMs: 300 },
}

const inFlightByCancelKey = new Map<string, AbortController>()
const retryableMethods = new Set(["get", "head", "options"])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizePath = (url?: string) => {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url)
      return parsed.pathname
    } catch {
      return url
    }
  }
  return url
}

const resolveDomain = (url?: string): DomainName => {
  const path = normalizePath(url)
  if (!path) return "default"

  const trimmed = path.startsWith("/") ? path.slice(1) : path
  const [firstSegment] = trimmed.split("/")
  if (!firstSegment) return "default"

  const knownDomains = new Set<DomainName>(Object.keys(domainPolicies) as DomainName[])
  if (knownDomains.has(firstSegment as DomainName)) {
    return firstSegment as DomainName
  }

  if (path.includes("/client-portal")) return "client-portal"
  if (path.includes("/access-control")) return "roles"
  if (path.includes("/security-audit")) return "audit"
  return "default"
}

const parseRetryAfterMs = (error: AxiosError, fallbackDelayMs: number) => {
  const retryAfter = error.response?.headers?.["retry-after"]
  if (!retryAfter) return fallbackDelayMs

  const fromSeconds = Number(retryAfter)
  if (Number.isFinite(fromSeconds) && fromSeconds >= 0) {
    return fromSeconds * 1000
  }

  const asDate = Date.parse(String(retryAfter))
  if (Number.isNaN(asDate)) return fallbackDelayMs
  return Math.max(0, asDate - Date.now())
}

const shouldRetry = (error: AxiosError, config: ApiRequestConfig, maxRetries: number) => {
  if (config.skipRetry) return false
  const method = (config.method ?? "get").toLowerCase()
  if (!retryableMethods.has(method)) return false

  const attempt = config.__meta?.retryCount ?? 0
  if (attempt >= maxRetries) return false

  if (error.code === "ERR_CANCELED") return false
  if (error.code === "ECONNABORTED") return true

  const status = error.response?.status
  if (!status) return true

  return status === 408 || status === 429 || status >= 500
}

const clearCancelKeyIfOwnsController = (config?: ApiRequestConfig) => {
  const cancelMapKey = config?.__meta?.cancelMapKey
  const cancelController = config?.__meta?.cancelController
  if (!cancelMapKey || !cancelController) return

  const current = inFlightByCancelKey.get(cancelMapKey)
  if (current === cancelController) {
    inFlightByCancelKey.delete(cancelMapKey)
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(
  (rawConfig) => {
    const config = rawConfig as ApiRequestConfig
    const domain = resolveDomain(config.url)
    const policy = domainPolicies[domain] ?? domainPolicies.default

    config.timeout = config.timeout ?? policy.timeoutMs
    config.__meta = {
      retryCount: config.__meta?.retryCount ?? 0,
      domain,
      policy,
    }

    if (!config.signal && config.cancelKey) {
      const cancelMapKey = `${domain}:${config.cancelKey}`
      inFlightByCancelKey.get(cancelMapKey)?.abort()

      const controller = new AbortController()
      inFlightByCancelKey.set(cancelMapKey, controller)
      config.signal = controller.signal
      config.__meta.cancelMapKey = cancelMapKey
      config.__meta.cancelController = controller
    }

    const isClientPortal = domain === "client-portal"
    const token = isClientPortal ? getClientToken() : getAuthToken()

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    config.headers = config.headers ?? {}
    config.headers["Accept-Language"] = getCurrentLocale()

    return config
  },
  (error) => Promise.reject(normalizeApiError(error)),
)

api.interceptors.response.use(
  (response) => {
    clearCancelKeyIfOwnsController(response.config as ApiRequestConfig)
    return response
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error))
    }

    const config = error.config as ApiRequestConfig | undefined
    if (!config) return Promise.reject(normalizeApiError(error))

    clearCancelKeyIfOwnsController(config)

    const policy = config.__meta?.policy ?? domainPolicies.default
    const maxRetries = config.maxRetries ?? policy.retries

    if (!shouldRetry(error, config, maxRetries)) {
      return Promise.reject(normalizeApiError(error))
    }

    config.__meta = {
      ...(config.__meta ?? { domain: "default", policy }),
      retryCount: (config.__meta?.retryCount ?? 0) + 1,
    }

    const retryDelayMs = parseRetryAfterMs(error, config.retryDelayMs ?? policy.retryDelayMs)
    await sleep(retryDelayMs)

    return api.request(config)
  },
)

export default api
