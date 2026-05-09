export interface AppEnv {
  NODE_ENV?: string
  PORT?: string
  CORS_ALLOWED_ORIGINS: string
  DATABASE_URL?: string
  JWT_SECRET?: string
  APP_ENCRYPTION_KEY?: string
  JWT_EXPIRES_IN?: string
  BOOTSTRAP_ADMIN_EMAIL?: string
  BOOTSTRAP_ADMIN_PASSWORD?: string
  BOOTSTRAP_ADMIN_NAME?: string
  MIKROTIK_HOST?: string
  MIKROTIK_PORT?: string
  MIKROTIK_USER?: string
  MIKROTIK_PASSWORD?: string
  MIKROTIK_MODE?: string
  MIKROTIK_USE_SSL?: string
  MIKROTIK_TLS_REJECT_UNAUTHORIZED?: string
  MONITORING_TRAFFIC_SAMPLING_MS?: string
  PAYMENTS_WEBHOOK_SECRET?: string
  CLIENT_PORTAL_BASE_URL?: string
  BILLING_AUTOMATION_ENABLED?: string
  BILLING_AUTOMATION_INTERVAL_MINUTES?: string
  BILLING_CUT_DAY?: string
  BILLING_DUE_DAYS?: string
  NOTIFICATIONS_EMAIL_WEBHOOK_URL?: string
  NOTIFICATIONS_WHATSAPP_WEBHOOK_URL?: string
  NOTIFICATIONS_WEBHOOK_AUTH_HEADER?: string
  CLIENT_PORTAL_DEFAULT_PASSWORD?: string
}

const requiredString = (value: unknown, fallback: string) => {
  if (typeof value !== "string" || !value.trim()) return fallback
  return value.trim()
}

const requiredValue = (value: unknown, name: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value.trim()
}

export const validateEnv = (env: Record<string, unknown>) => {
  const normalized: AppEnv = {
    NODE_ENV: typeof env["NODE_ENV"] === "string" ? env["NODE_ENV"] : "development",
    PORT: typeof env["PORT"] === "string" && env["PORT"].trim() ? env["PORT"].trim() : "8000",
    CORS_ALLOWED_ORIGINS: requiredString(env["CORS_ALLOWED_ORIGINS"], "http://localhost:5173"),
    DATABASE_URL: requiredValue(env["DATABASE_URL"], "DATABASE_URL"),
    JWT_SECRET: requiredValue(env["JWT_SECRET"], "JWT_SECRET"),
    APP_ENCRYPTION_KEY: typeof env["APP_ENCRYPTION_KEY"] === "string" ? env["APP_ENCRYPTION_KEY"] : undefined,
    JWT_EXPIRES_IN: typeof env["JWT_EXPIRES_IN"] === "string" ? env["JWT_EXPIRES_IN"] : undefined,
    BOOTSTRAP_ADMIN_EMAIL: typeof env["BOOTSTRAP_ADMIN_EMAIL"] === "string" ? env["BOOTSTRAP_ADMIN_EMAIL"] : undefined,
    BOOTSTRAP_ADMIN_PASSWORD:
      typeof env["BOOTSTRAP_ADMIN_PASSWORD"] === "string" ? env["BOOTSTRAP_ADMIN_PASSWORD"] : undefined,
    BOOTSTRAP_ADMIN_NAME: typeof env["BOOTSTRAP_ADMIN_NAME"] === "string" ? env["BOOTSTRAP_ADMIN_NAME"] : undefined,
    MIKROTIK_HOST: typeof env["MIKROTIK_HOST"] === "string" ? env["MIKROTIK_HOST"] : undefined,
    MIKROTIK_PORT: typeof env["MIKROTIK_PORT"] === "string" ? env["MIKROTIK_PORT"] : undefined,
    MIKROTIK_USER: typeof env["MIKROTIK_USER"] === "string" ? env["MIKROTIK_USER"] : undefined,
    MIKROTIK_PASSWORD: typeof env["MIKROTIK_PASSWORD"] === "string" ? env["MIKROTIK_PASSWORD"] : undefined,
    MIKROTIK_MODE: typeof env["MIKROTIK_MODE"] === "string" ? env["MIKROTIK_MODE"] : "live",
    MIKROTIK_USE_SSL: typeof env["MIKROTIK_USE_SSL"] === "string" ? env["MIKROTIK_USE_SSL"] : undefined,
    MIKROTIK_TLS_REJECT_UNAUTHORIZED:
      typeof env["MIKROTIK_TLS_REJECT_UNAUTHORIZED"] === "string"
        ? env["MIKROTIK_TLS_REJECT_UNAUTHORIZED"]
        : undefined,
    MONITORING_TRAFFIC_SAMPLING_MS:
      typeof env["MONITORING_TRAFFIC_SAMPLING_MS"] === "string" ? env["MONITORING_TRAFFIC_SAMPLING_MS"] : undefined,
    PAYMENTS_WEBHOOK_SECRET:
      typeof env["PAYMENTS_WEBHOOK_SECRET"] === "string" ? env["PAYMENTS_WEBHOOK_SECRET"] : undefined,
    CLIENT_PORTAL_BASE_URL:
      typeof env["CLIENT_PORTAL_BASE_URL"] === "string" ? env["CLIENT_PORTAL_BASE_URL"] : undefined,
    BILLING_AUTOMATION_ENABLED:
      typeof env["BILLING_AUTOMATION_ENABLED"] === "string" ? env["BILLING_AUTOMATION_ENABLED"] : undefined,
    BILLING_AUTOMATION_INTERVAL_MINUTES:
      typeof env["BILLING_AUTOMATION_INTERVAL_MINUTES"] === "string" ? env["BILLING_AUTOMATION_INTERVAL_MINUTES"] : undefined,
    BILLING_CUT_DAY: typeof env["BILLING_CUT_DAY"] === "string" ? env["BILLING_CUT_DAY"] : undefined,
    BILLING_DUE_DAYS: typeof env["BILLING_DUE_DAYS"] === "string" ? env["BILLING_DUE_DAYS"] : undefined,
    NOTIFICATIONS_EMAIL_WEBHOOK_URL:
      typeof env["NOTIFICATIONS_EMAIL_WEBHOOK_URL"] === "string" ? env["NOTIFICATIONS_EMAIL_WEBHOOK_URL"] : undefined,
    NOTIFICATIONS_WHATSAPP_WEBHOOK_URL:
      typeof env["NOTIFICATIONS_WHATSAPP_WEBHOOK_URL"] === "string" ? env["NOTIFICATIONS_WHATSAPP_WEBHOOK_URL"] : undefined,
    NOTIFICATIONS_WEBHOOK_AUTH_HEADER:
      typeof env["NOTIFICATIONS_WEBHOOK_AUTH_HEADER"] === "string" ? env["NOTIFICATIONS_WEBHOOK_AUTH_HEADER"] : undefined,
    CLIENT_PORTAL_DEFAULT_PASSWORD:
      typeof env["CLIENT_PORTAL_DEFAULT_PASSWORD"] === "string" ? env["CLIENT_PORTAL_DEFAULT_PASSWORD"] : undefined,
  }

  return normalized
}
