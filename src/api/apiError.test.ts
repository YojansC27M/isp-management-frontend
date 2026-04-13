import { describe, expect, it } from "vitest"
import { isApiError, normalizeApiError } from "./apiError"

describe("normalizeApiError", () => {
  it("normalizes axios-like forbidden response", () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: {
        status: 403,
        data: { message: "Sin permisos" },
      },
      message: "Request failed",
    }

    const normalized = normalizeApiError(axiosLikeError)

    expect(isApiError(normalized)).toBe(true)
    expect(normalized.code).toBe("forbidden")
    expect(normalized.status).toBe(403)
    expect(normalized.message).toBe("Sin permisos")
    expect(normalized.isRetryable).toBe(false)
  })

  it("normalizes timeout as retryable", () => {
    const timeoutError = {
      isAxiosError: true,
      code: "ECONNABORTED",
      message: "timeout exceeded",
    }

    const normalized = normalizeApiError(timeoutError)

    expect(normalized.code).toBe("timeout")
    expect(normalized.isRetryable).toBe(true)
  })

  it("uses fallback for unknown values", () => {
    const normalized = normalizeApiError(null, "fallback")
    expect(normalized.code).toBe("unknown")
    expect(normalized.message).toBe("fallback")
  })
})
