import { describe, expect, it } from "vitest"
import { getErrorDescription, getErrorDetails, getErrorMessage } from "./errors"

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

  it("returns details list for backend details array", () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: "Validation failed",
          details: ["email should not be empty", "phone should not be empty"],
        },
      },
      message: "generic",
    }

    const details = getErrorDetails(axiosLikeError)
    expect(details).toEqual(["email should not be empty", "phone should not be empty"])
  })

  it("combines message and details in description", () => {
    const axiosLikeError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          message: "Validation failed",
          details: ["email should not be empty"],
        },
      },
      message: "generic",
    }

    const description = getErrorDescription(axiosLikeError, "fallback")
    expect(description).toContain("Validation failed")
    expect(description).toContain("Detalles: email should not be empty")
  })
})
