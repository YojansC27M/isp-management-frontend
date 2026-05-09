import { BadRequestException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TicketsService } from "../src/modules/tickets/tickets.service"

describe("TicketsService", () => {
  let prismaMock: any
  let service: TicketsService

  beforeEach(() => {
    prismaMock = {
      ticket: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      client: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      systemSetting: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
      },
    }

    service = new TicketsService(prismaMock)
  })

  it("rejects invalid ticket status transitions", async () => {
    prismaMock.ticket.findUnique.mockResolvedValueOnce({ id: "t-1", status: "open" })

    await expect(
      service.update(
        "t-1",
        {
          clientId: "c-1",
          assignedUserId: "",
          assignedUserName: "",
          assignedTechnicianId: "",
          assignedTechnicianName: "",
          title: "Ticket",
          description: "Descripcion valida",
          status: "resolved",
          priority: "medium",
          category: "technical",
        },
        "usr-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("accepts waiting as a valid ticket status transition", async () => {
    prismaMock.ticket.findUnique.mockResolvedValueOnce({ id: "t-1", status: "open" })
    prismaMock.client.findUnique.mockResolvedValueOnce({ id: "c-1" })
    prismaMock.ticket.update.mockResolvedValueOnce({
      id: "t-1",
      clientId: "c-1",
      client: { name: "Cliente" },
      title: "Ticket",
      description: "Descripcion valida",
      status: "waiting",
      priority: "medium",
      category: "technical",
      assignedUserId: "",
      assignedUserName: "",
      assignedTechnicianId: "",
      assignedTechnicianName: "",
      createdAt: new Date(),
      comments: [],
    })

    await expect(
      service.update(
        "t-1",
        {
          clientId: "c-1",
          assignedUserId: "",
          assignedUserName: "",
          assignedTechnicianId: "",
          assignedTechnicianName: "",
          title: "Ticket",
          description: "Descripcion valida",
          status: "waiting",
          priority: "medium",
          category: "technical",
        },
        "usr-1",
      ),
    ).resolves.toBeDefined()
  })

  it("rejects technician assignment for billing tickets", async () => {
    prismaMock.client.findUnique.mockResolvedValue({ id: "c-1" })

    await expect(
      service.create(
        {
          clientId: "c-1",
          assignedUserId: "",
          assignedUserName: "",
          assignedTechnicianId: "tech-1",
          assignedTechnicianName: "T1",
          title: "Ticket billing",
          description: "Descripcion valida",
          status: "open",
          priority: "medium",
          category: "billing",
        },
        "usr-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
