import { describe, expect, it } from "vitest"
import { getErrorMessage } from "./errors"

describe("getErrorMessage", () => {
  it("returns message from standard Error", () => {
    const result = getErrorMessage(new Error("boom"), "fallback")
    expect(result).toBe("boom")
  })

  it("returns nested API message for axios-like errors", () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: {
        data: {
          message: "API failed",
        },
      },
      message: "generic",
    }

    const result = getErrorMessage(axiosLikeError, "fallback")
    expect(result).toBe("API failed")
  })

  it("returns fallback for unknown input", () => {
    const result = getErrorMessage(null, "fallback")
    expect(result).toBe("fallback")
  })
})
