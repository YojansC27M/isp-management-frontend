import { NotFoundException } from "@nestjs/common"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { MonitoringService } from "../src/modules/monitoring/monitoring.service"

describe("MonitoringService", () => {
  let prismaMock: any
  let mikrotikMock: any
  let service: MonitoringService

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
      router: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      routerTrafficSample: {
        upsert: vi.fn(),
      },
    }
    mikrotikMock = {
      getHealth: vi.fn(),
      getInterfaces: vi.fn(),
    }
    service = new MonitoringService(prismaMock, mikrotikMock)
  })

  it("throws not found when router does not exist", async () => {
    prismaMock.router.findUnique.mockResolvedValue(null)

    await expect(service.getRouterMetrics("router-1")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("returns degraded fallback when provider fails", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      ip: "10.0.0.1",
      port: 80,
      username: "admin",
      password: "secret",
    })
    mikrotikMock.getHealth.mockRejectedValue(new Error("provider timeout"))
    mikrotikMock.getInterfaces.mockRejectedValue(new Error("provider timeout"))

    const result = await service.getRouterMetrics("router-1")

    expect(result).toEqual({
      cpuUsage: 0,
      ramUsage: 0,
      uptime: "0d 0h",
      totalTraffic: "0 Mbps",
      rxTraffic: "0 Mbps",
      txTraffic: "0 Mbps",
      degraded: true,
    })
  })

  it("stores real traffic sample when metrics are fetched", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
    })
    mikrotikMock.getHealth.mockResolvedValue({
      cpu: 42,
      ram: 33,
      uptimeSeconds: 172800,
    })
    mikrotikMock.getInterfaces.mockResolvedValue([
      { name: "ether1", status: "up", rxMbps: 20, txMbps: 10 },
      { name: "ether2", status: "up", rxMbps: 5, txMbps: 3 },
    ])

    await service.getRouterMetrics("router-1")

    expect(prismaMock.routerTrafficSample.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          routerId: "router-1",
          rxMbps: 25,
          txMbps: 13,
          totalMbps: 38,
        }),
      }),
    )
  })

  it("returns router interfaces from provider", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
    })
    mikrotikMock.getInterfaces.mockResolvedValue([
      { name: "ether1", status: "up", rxMbps: 100, txMbps: 80 },
      { name: "wlan1", status: "down", rxMbps: 0, txMbps: 0 },
    ])

    const result = await service.getRouterInterfaces("router-1")

    expect(result).toEqual([
      { name: "ether1", status: "up", rx: "100.00 Mbps", tx: "80.00 Mbps", rxMbps: 100, txMbps: 80 },
      { name: "wlan1", status: "down", rx: "0.00 Mbps", tx: "0.00 Mbps", rxMbps: 0, txMbps: 0 },
    ])
  })

  it("returns fallback interface when provider fails", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
    })
    mikrotikMock.getInterfaces.mockRejectedValue(new Error("provider timeout"))

    const result = await service.getRouterInterfaces("router-1")

    expect(result).toEqual([{ name: "connection-unavailable", status: "down", rx: "0 Mbps", tx: "0 Mbps", rxMbps: 0, txMbps: 0 }])
  })
})
