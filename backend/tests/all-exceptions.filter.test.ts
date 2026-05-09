import { BadRequestException } from "@nestjs/common"
import { describe, expect, it, vi } from "vitest"
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter"

const createHost = (requestId = "req-test-1") => {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const response = { status } as any
  const request = { headers: { "x-request-id": requestId } } as any

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as any

  return { host, status, json }
}

describe("AllExceptionsFilter", () => {
  it("normalizes validation error payloads and preserves request id", () => {
    const filter = new AllExceptionsFilter()
    const { host, status, json } = createHost()
    const exception = new BadRequestException(["email must be an email", "password should not be empty"])

    filter.catch(exception, host)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "email must be an email",
        code: "HTTP_400",
        details: ["email must be an email", "password should not be empty"],
        requestId: "req-test-1",
      }),
    )
  })

  it("normalizes unknown errors with standard payload", () => {
    const filter = new AllExceptionsFilter()
    const { host, status, json } = createHost("req-test-2")

    filter.catch(new Error("unexpected"), host)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
      requestId: "req-test-2",
    })
  })
})
