import "axios"

declare module "axios" {
  interface AxiosRequestConfig {
    cancelKey?: string
    skipRetry?: boolean
    maxRetries?: number
    retryDelayMs?: number
  }
}
