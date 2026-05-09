import { beforeEach, describe, expect, it, vi } from "vitest"
import { SupportService } from "../src/modules/support/support.service"

describe("SupportService", () => {
  let prismaMock: any
  let service: SupportService

  beforeEach(() => {
    prismaMock = {
      ticket: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "open", _count: { _all: 3 } },
          { status: "in_progress", _count: { _all: 2 } },
        ]),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "t-1",
            title: "Sin servicio",
            status: "open",
            priority: "high",
            updatedAt: new Date("2026-04-20T12:00:00.000Z"),
            client: { name: "Cliente Uno" },
          },
        ]),
      },
      visit: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "scheduled", _count: { _all: 4 } },
          { status: "completed", _count: { _all: 5 } },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    }

    service = new SupportService(prismaMock)
  })

  it("returns support overview and writes audit entry", async () => {
    const overview = await service.getOverview(7, "usr-1")

    expect(overview.windowDays).toBe(7)
    expect(overview.tickets.total).toBe(5)
    expect(overview.visits.total).toBe(9)
    expect(overview.recentTicketActivity).toHaveLength(1)
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "support.overview.read",
          userId: "usr-1",
        }),
      }),
    )
  })
})

