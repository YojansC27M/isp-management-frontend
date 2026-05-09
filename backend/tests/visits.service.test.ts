import { BadRequestException, ConflictException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { VisitsService } from "../src/modules/visits/visits.service"

describe("VisitsService", () => {
  let prismaMock: any
  let service: VisitsService

  beforeEach(() => {
    prismaMock = {
      visit: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
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

    service = new VisitsService(prismaMock)
  })

  it("rejects invalid visit status transitions", async () => {
    prismaMock.visit.findUnique.mockResolvedValueOnce({ id: "v-1", status: "scheduled" })

    await expect(
      service.update(
        "v-1",
        {
          clientId: "c-1",
          technicianId: "",
          technicianName: "",
          zone: "Norte",
          type: "support",
          scheduledDate: "2026-04-22",
          scheduledTime: "10:00",
          status: "completed",
          notes: "",
        },
        "usr-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("rejects reschedule when visit is in progress", async () => {
    prismaMock.visit.findUnique.mockResolvedValueOnce({
      id: "v-2",
      status: "in_progress",
      client: { id: "c-1", name: "Cliente 1" },
    })

    await expect(
      service.reschedule(
        "v-2",
        {
          scheduledDate: "2026-04-23",
          scheduledTime: "12:30",
          notes: "Mover visita",
        },
        "usr-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("rejects creating a conflicting visit for the same technician time slot", async () => {
    prismaMock.client.findUnique.mockResolvedValueOnce({ id: "c-1" })
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "tech-1",
      name: "Tecnico 1",
      role: { key: "technician" },
    })
    prismaMock.systemSetting.findUnique.mockResolvedValueOnce({ value: { status: "active" } })
    prismaMock.visit.findFirst.mockResolvedValueOnce({
      id: "v-3",
      client: { name: "Cliente con conflicto" },
    })

    await expect(
      service.create(
        {
          clientId: "c-1",
          technicianId: "tech-1",
          technicianName: "",
          zone: "Norte",
          type: "support",
          scheduledDate: "2026-04-22",
          scheduledTime: "10:00",
          status: "scheduled",
          notes: "",
        },
        "usr-1",
      ),
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
