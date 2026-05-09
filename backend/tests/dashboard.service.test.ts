import { beforeEach, describe, expect, it, vi } from "vitest"
import { DashboardService } from "../src/modules/dashboard/dashboard.service"

describe("DashboardService", () => {
  let prismaMock: any
  let service: DashboardService

  beforeEach(() => {
    const now = new Date()
    const currentHour = new Date(now)
    currentHour.setMinutes(0, 0, 0)
    const oneHourAgo = new Date(currentHour.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(currentHour.getTime() - 2 * 60 * 60 * 1000)

    prismaMock = {
      client: { count: vi.fn().mockResolvedValue(120) },
      ticket: {
        count: vi.fn().mockResolvedValue(8),
        findMany: vi.fn().mockResolvedValue([
          { id: "t-1", title: "Caida de enlace", status: "open", priority: "high", createdAt: new Date() },
        ]),
      },
      visit: { count: vi.fn().mockResolvedValue(4) },
      invoice: {
        count: vi.fn().mockResolvedValue(3),
        aggregate: vi
          .fn()
          .mockResolvedValueOnce({ _sum: { total: 2500 } })
          .mockResolvedValueOnce({ _sum: { total: 500 } })
          .mockResolvedValueOnce({ _sum: { total: 300 } })
          .mockResolvedValueOnce({ _sum: { total: 1700 } }),
      },
      payment: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 1500 } }),
      },
      router: {
        count: vi.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(4),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "r-1",
            name: "POP Norte",
            ip: "10.0.0.1",
            port: 80,
            status: "offline",
            updatedAt: new Date(),
          },
        ]),
      },
      routerTrafficSample: {
        findMany: vi.fn().mockResolvedValue([
          { sampledMinute: twoHoursAgo, totalMbps: 30 },
          { sampledMinute: oneHourAgo, totalMbps: 50 },
          { sampledMinute: currentHour, totalMbps: 40 },
        ]),
      },
      systemSetting: {
        findUnique: vi.fn().mockResolvedValue({
          value: {
            currency: "COP",
            timezone: "America/Bogota",
          },
        }),
      },
    }

    service = new DashboardService(prismaMock)
  })

  it("returns operational dashboard overview", async () => {
    const result = await service.getOverview()

    expect(result.summary.activeClients).toBe(120)
    expect(result.summary.routersTotal).toBe(5)
    expect(result.summary.routersOnline).toBe(4)
    expect(result.summary.monthRevenue).toBe(1500)
    expect(result.operationStatus).toBe("online")
    expect(result.incidents.length).toBeGreaterThan(0)
    expect(result.activityByHour).toHaveLength(5)
    expect(result.activityByHour.some((point) => point.usagePercent > 0)).toBe(true)
    expect(result.reporting.totalRevenue).toBe(2500)
    expect(result.formatting.currency).toBe("COP")
    expect(result.formatting.timezone).toBe("America/Bogota")
  })
})
