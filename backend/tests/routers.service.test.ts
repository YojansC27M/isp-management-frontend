import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RoutersService } from "../src/modules/routers/routers.service"

describe("RoutersService", () => {
  let prismaMock: any
  let mikrotikMock: any
  let service: RoutersService

  beforeEach(() => {
    prismaMock = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("relation does not exist")),
      $executeRaw: vi.fn(),
      router: {
        findUnique: vi.fn(),
      },
      systemSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    }

    mikrotikMock = {
      createBackupSnapshot: vi.fn(),
    }

    service = new RoutersService(prismaMock, mikrotikMock)
  })

  it("creates backup and stores metadata", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
    })
    prismaMock.systemSetting.findUnique.mockResolvedValue(null)
    mikrotikMock.createBackupSnapshot.mockResolvedValue({
      fileName: "backup.rsc",
      content: "/interface print",
      sizeBytes: 20,
      checksum: "abc123",
      createdAt: "2026-04-20T12:00:00.000Z",
    })

    const backup = await service.createBackup("router-1", "usr-1")

    expect(backup.fileName).toBe("backup.rsc")
    expect(prismaMock.systemSetting.upsert).toHaveBeenCalled()
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "routers.backup.create",
          userId: "usr-1",
        }),
      }),
    )
  })

  it("lists backups without content", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      name: "RTR-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
      zone: "Norte",
      location: "Nodo",
      latitude: null,
      longitude: null,
      status: "online",
      lastCheckedAt: new Date("2026-04-20T12:00:00.000Z"),
      createdAt: new Date("2026-04-20T12:00:00.000Z"),
    })
    prismaMock.systemSetting.findUnique.mockResolvedValue({
      value: [
        {
          id: "b1",
          fileName: "router-backup.rsc",
          createdAt: "2026-04-20T12:00:00.000Z",
          sizeBytes: 1200,
          checksum: "abc",
          source: "mikrotik",
          content: "raw",
        },
      ],
    })

    const backups = await service.listBackups("router-1")

    expect(backups).toEqual([
      {
        id: "b1",
        fileName: "router-backup.rsc",
        createdAt: "2026-04-20T12:00:00.000Z",
        sizeBytes: 1200,
        checksum: "abc",
        source: "mikrotik",
      },
    ])
  })

  it("throws when download backup does not exist", async () => {
    prismaMock.router.findUnique.mockResolvedValue({
      id: "router-1",
      name: "RTR-1",
      ip: "10.0.0.1",
      port: 8728,
      username: "admin",
      password: "secret",
      zone: "Norte",
      location: "Nodo",
      latitude: null,
      longitude: null,
      status: "online",
      lastCheckedAt: new Date("2026-04-20T12:00:00.000Z"),
      createdAt: new Date("2026-04-20T12:00:00.000Z"),
    })
    prismaMock.systemSetting.findUnique.mockResolvedValue({ value: [] })

    await expect(service.downloadBackup("router-1", "missing", "usr-1")).rejects.toBeInstanceOf(NotFoundException)
  })
})
