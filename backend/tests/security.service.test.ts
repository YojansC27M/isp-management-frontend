import { BadRequestException } from "@nestjs/common"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { SecurityService } from "../src/modules/security/security.service"

describe("SecurityService", () => {
  let prismaMock: any
  let service: SecurityService

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
      permission: { findMany: vi.fn() },
      role: { findMany: vi.fn(), findUnique: vi.fn() },
      rolePermission: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
      auditLog: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    }
    service = new SecurityService(prismaMock)
  })

  it("applies filters in getAudit query", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([])

    await service.getAudit({
      limit: 25,
      actorId: "usr-1",
      module: "payments",
      action: "update",
      dateFrom: "2026-01-01T00:00:00.000Z",
      dateTo: "2026-12-31T23:59:59.000Z",
    })

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        where: expect.any(Object),
      }),
    )
  })

  it("exports audit entries as CSV", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: "audit-1",
        createdAt: new Date("2026-04-17T12:00:00.000Z"),
        userId: "usr-1",
        action: "payments.update",
        entity: "payment",
        entityId: "pay-1",
        user: { email: "admin@isp.com" },
      },
    ])

    const csv = await service.exportAuditCsv({ limit: 10 })

    expect(csv).toContain("id,createdAt,userId,userEmail,action,entity,entityId")
    expect(csv).toContain("payments.update")
    expect(csv).toContain("admin@isp.com")
  })

  it("rejects date ranges where dateFrom is greater than dateTo", async () => {
    expect(() =>
      service.getAudit({
        dateFrom: "2026-05-10T00:00:00.000Z",
        dateTo: "2026-05-01T00:00:00.000Z",
      }),
    ).toThrow(BadRequestException)
  })

  it("is idempotent when role permissions are unchanged", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "role-1", key: "admin" })
    prismaMock.permission.findMany.mockResolvedValue([
      { id: "perm-1", key: "clients.read" },
      { id: "perm-2", key: "tickets.read" },
    ])
    prismaMock.rolePermission.findMany.mockResolvedValue([
      { permission: { key: "tickets.read" } },
      { permission: { key: "clients.read" } },
    ])
    prismaMock.auditLog.create.mockResolvedValue({})
    prismaMock.role.findUnique.mockResolvedValueOnce({ id: "role-1", key: "admin" }).mockResolvedValueOnce({
      id: "role-1",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      permissions: [
        { permission: { key: "clients.read" } },
        { permission: { key: "tickets.read" } },
      ],
    })

    const result = await service.updateRolePermissions("role-1", ["tickets.read", "clients.read"], "usr-1")

    expect(result.permissions).toEqual(["clients.read", "tickets.read"])
    expect(prismaMock.rolePermission.deleteMany).not.toHaveBeenCalled()
    expect(prismaMock.rolePermission.createMany).not.toHaveBeenCalled()
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "roles.update_permissions.noop",
        }),
      }),
    )
  })

  it("rejects unknown permissions in role updates", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "role-1", key: "admin" })
    prismaMock.permission.findMany.mockResolvedValue([{ id: "perm-1", key: "clients.read" }])
    prismaMock.rolePermission.findMany.mockResolvedValue([])

    await expect(service.updateRolePermissions("role-1", ["clients.read", "invalid.permission"], "usr-1")).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(prismaMock.rolePermission.deleteMany).not.toHaveBeenCalled()
    expect(prismaMock.rolePermission.createMany).not.toHaveBeenCalled()
  })
})
