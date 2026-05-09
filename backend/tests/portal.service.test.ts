import { UnauthorizedException } from "@nestjs/common"
import { describe, expect, it, vi, beforeEach } from "vitest"
import * as bcrypt from "bcryptjs"
import { PortalService } from "../src/modules/portal/portal.service"

describe("PortalService", () => {
  let prismaMock: any
  let jwtMock: any
  let configMock: any
  let service: PortalService

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => callback(prismaMock)),
      user: {
        findUnique: vi.fn(),
      },
      systemSetting: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      client: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      ticket: {
        create: vi.fn(),
        findUniqueOrThrow: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    }

    jwtMock = {
      signAsync: vi.fn().mockResolvedValue("portal-token"),
    }

    configMock = {
      get: vi.fn().mockReturnValue("8h"),
      getOrThrow: vi.fn().mockReturnValue("portal-secret"),
    }

    service = new PortalService(prismaMock, jwtMock, configMock)
  })

  it("denies login when user role is not client", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr-1",
      email: "admin@isp.com",
      passwordHash: bcrypt.hashSync("secret", 8),
      role: { key: "admin" },
    })

    await expect(service.login("admin@isp.com", "secret")).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it("denies login when there is no exact client match", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr-2",
      email: "client@isp.com",
      passwordHash: bcrypt.hashSync("secret", 8),
      role: { key: "client" },
    })
    prismaMock.client.findFirst.mockResolvedValue(null)

    await expect(service.login("client@isp.com", "secret")).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it("returns token when credentials and client context are valid", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "usr-3",
      email: "client@isp.com",
      name: "Client User",
      passwordHash: bcrypt.hashSync("secret", 8),
      role: { key: "client" },
    })
    prismaMock.client.findFirst.mockResolvedValue({
      id: "cli-1",
      email: "client@isp.com",
      status: "active",
    })

    const result = await service.login("client@isp.com", "secret")

    expect(result.token).toBe("portal-token")
    expect(result.clientId).toBe("cli-1")
  })

  it("creates a portal ticket with open status", async () => {
    prismaMock.client.findUnique.mockResolvedValue({
      id: "cli-1",
      name: "Client",
      plan: { name: "Fiber 200" },
    })
    prismaMock.ticket.create.mockResolvedValue({
      id: "tck-1",
      title: "Internet intermitente",
      description: "Se cae cada 15 minutos",
      status: "open",
      priority: "high",
      category: "technical",
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    })
    prismaMock.ticket.findUniqueOrThrow.mockResolvedValue({
      id: "tck-1",
      title: "Internet intermitente",
      description: "Se cae cada 15 minutos",
      status: "open",
      priority: "high",
      category: "technical",
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      clientId: "cli-1",
      client: { name: "Client" },
      assignedUserId: "",
      assignedUserName: "",
      assignedTechnicianId: "",
      assignedTechnicianName: "",
      comments: [],
      attachments: [],
    })

    const result = await service.createTicket("usr-3", "cli-1", {
      title: " Internet intermitente ",
      description: " Se cae cada 15 minutos ",
      priority: "high",
      category: "technical",
    })

    expect(prismaMock.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: "cli-1",
          status: "open",
          priority: "high",
          category: "technical",
          assignedUserId: "",
        }),
      }),
    )
    expect(result.id).toBe("tck-1")
    expect(result.status).toBe("open")
  })
})
