import { BadRequestException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ReportingService } from "../src/modules/reporting/reporting.service"

describe("ReportingService", () => {
  let prismaMock: any
  let service: ReportingService

  beforeEach(() => {
    prismaMock = {
      invoice: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "inv-1",
            clientId: "cli-1",
            total: 100,
            status: "paid",
            issuedAt: new Date("2026-04-01T00:00:00.000Z"),
            dueAt: new Date("2026-04-10T00:00:00.000Z"),
            client: { name: "Cliente 1" },
          },
          {
            id: "inv-2",
            clientId: "cli-2",
            total: 50,
            status: "overdue",
            issuedAt: new Date("2026-04-03T00:00:00.000Z"),
            dueAt: new Date("2026-04-09T00:00:00.000Z"),
            client: { name: "Cliente 2" },
          },
        ]),
      },
      ticket: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "open", _count: { status: 2 } },
          { status: "in_progress", _count: { status: 1 } },
          { status: "resolved", _count: { status: 3 } },
        ]),
      },
      visit: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "scheduled", _count: { status: 4 } },
          { status: "completed", _count: { status: 2 } },
        ]),
      },
      installation: {
        groupBy: vi.fn().mockResolvedValue([
          { status: "pending", _count: { status: 2 } },
          { status: "installed", _count: { status: 1 } },
        ]),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    }

    service = new ReportingService(prismaMock)
  })

  it("rejects invalid date ranges", async () => {
    await expect(
      service.getMetrics({
        dateFrom: "2026-05-10",
        dateTo: "2026-05-01",
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("exports csv report and writes audit log", async () => {
    const exported = await service.exportReport(
      {
        format: "csv",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-30",
      },
      "usr-1",
    )

    expect(exported.contentType).toContain("text/csv")
    expect(exported.fileName).toContain("reports-")
    expect(exported.buffer.toString("utf-8")).toContain("metrics,totalRevenue,150")
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "reports.export",
          userId: "usr-1",
        }),
      }),
    )
  })

  it("returns operations metrics", async () => {
    const metrics = await service.getOperations({
      dateFrom: "2026-04-01",
      dateTo: "2026-04-30",
    })

    expect(metrics).toEqual({
      openTickets: 2,
      inProgressTickets: 1,
      resolvedTickets: 3,
      scheduledVisits: 4,
      completedVisits: 2,
      pendingInstallations: 2,
      completedInstallations: 1,
    })
  })
})
