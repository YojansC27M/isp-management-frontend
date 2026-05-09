import { Catch, HttpException, HttpStatus } from "@nestjs/common"
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common"
import type { Request, Response } from "express"

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const requestId = request.headers["x-request-id"]
    const normalizedRequestId = Array.isArray(requestId) ? requestId[0] : requestId

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const payload = exception.getResponse()

      response.status(status).json(this.normalizePayload(payload, status, normalizedRequestId))
      return
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
      details: [],
      requestId: normalizedRequestId ?? null,
    })
  }

  private normalizePayload(payload: string | object, status: number, requestId?: string) {
    if (typeof payload === "string") {
      return {
        message: payload,
        code: `HTTP_${status}`,
        details: [],
        requestId: requestId ?? null,
      }
    }

    if (payload && typeof payload === "object") {
      const body = payload as Record<string, unknown>
      const rawMessage = body["message"]
      const details = Array.isArray(body["details"])
        ? body["details"]
        : Array.isArray(rawMessage)
          ? rawMessage
          : []

      return {
        message:
          typeof rawMessage === "string"
            ? rawMessage
            : Array.isArray(rawMessage) && typeof rawMessage[0] === "string"
              ? rawMessage[0]
              : "Request failed",
        code: typeof body["code"] === "string" ? body["code"] : `HTTP_${status}`,
        details,
        requestId: requestId ?? null,
      }
    }

    return {
      message: "Request failed",
      code: `HTTP_${status}`,
      details: [],
      requestId: requestId ?? null,
    }
  }
}
