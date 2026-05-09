import { describe, expect, it, vi } from "vitest"
import { HealthService } from "../src/modules/health/health.service"

describe("HealthService", () => {
  it("returns liveness payload", () => {
    const prismaMock = { $queryRaw: vi.fn() } as any
    const service = new HealthService(prismaMock)

    const result = service.getLiveness()

    expect(result.status).toBe("ok")
    expect(result.service).toBe("isp-management-api")
    expect(typeof result.uptimeSeconds).toBe("number")
  })

  it("returns ready when database check succeeds", async () => {
    const prismaMock = {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
    } as any
    const service = new HealthService(prismaMock)

    const result = await service.getReadiness()

    expect(result.status).toBe("ready")
    expect(result.checks[0]).toEqual({ name: "database", status: "ok" })
  })

  it("returns not_ready when database check fails", async () => {
    const prismaMock = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("db down")),
    } as any
    const service = new HealthService(prismaMock)

    const result = await service.getReadiness()

    expect(result.status).toBe("not_ready")
    expect(result.checks[0]).toEqual({ name: "database", status: "error" })
  })
})
