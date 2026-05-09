import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateVisitDto, RescheduleVisitDto, UpdateVisitDto } from "./dto/visit.dto"

const visitInclude = {
  client: {
    select: {
      id: true,
      name: true,
    },
  },
} as const

const INTERNAL_USER_PROFILE_KEY_PREFIX = "internal_user_profile::"
const visitTransitions: Record<string, string[]> = {
  scheduled: ["in_progress", "canceled"],
  in_progress: ["completed", "canceled"],
  completed: [],
  canceled: [],
}
const activeVisitStatuses = ["scheduled", "in_progress"] as const

const toVisitShape = (visit: Prisma.VisitGetPayload<{ include: typeof visitInclude }>) => {
  const scheduledDate = visit.scheduledAt.toISOString().slice(0, 10)
  const scheduledTime = visit.scheduledAt.toISOString().slice(11, 16)

  return {
    id: visit.id,
    clientId: visit.clientId,
    clientName: visit.client.name,
    technicianId: visit.technicianId,
    technicianName: visit.technicianName,
    zone: visit.zone,
    type: visit.type,
    scheduledDate,
    scheduledTime,
    status: visit.status,
    notes: visit.notes ?? "",
  }
}

const parseScheduledAt = (scheduledDate: string, scheduledTime: string) => new Date(`${scheduledDate}T${scheduledTime}:00Z`)

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  private profileKey(userId: string) {
    return `${INTERNAL_USER_PROFILE_KEY_PREFIX}${userId}`
  }

  private parseInternalUserStatus(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "active"
    const rawStatus = (value as Record<string, unknown>)["status"]
    return rawStatus === "inactive" ? "inactive" : "active"
  }

  private async resolveTechnician(technicianId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    })

    if (!user || user.role?.key !== "technician") {
      throw new BadRequestException("Assigned technician is not valid")
    }

    const profile = await this.prisma.systemSetting.findUnique({
      where: { key: this.profileKey(user.id) },
    })
    if (this.parseInternalUserStatus(profile?.value) !== "active") {
      throw new BadRequestException("Assigned technician is inactive")
    }

    return user
  }

  private async ensureTechnicianAvailability(technicianId: string, scheduledAt: Date, excludeVisitId?: string) {
    if (!technicianId.trim()) return

    const conflictingVisit = await this.prisma.visit.findFirst({
      where: {
        technicianId,
        scheduledAt,
        status: { in: [...activeVisitStatuses] },
        ...(excludeVisitId ? { NOT: { id: excludeVisitId } } : {}),
      },
      select: {
        id: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    })

    if (conflictingVisit) {
      throw new ConflictException("Technician already has a visit scheduled at that time")
    }
  }

  private ensureAllowedStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) return

    const allowed = visitTransitions[currentStatus]
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException(`Invalid visit status transition: ${currentStatus} -> ${nextStatus}`)
    }
  }

  async list() {
    const visits = await this.prisma.visit.findMany({
      orderBy: [{ scheduledAt: "desc" }],
      include: visitInclude,
    })

    return visits.map(toVisitShape)
  }

  async listByClient(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    })

    if (!client) {
      throw new NotFoundException("Client not found")
    }

    const visits = await this.prisma.visit.findMany({
      where: { clientId },
      orderBy: [{ scheduledAt: "desc" }],
      include: visitInclude,
    })

    return visits.map(toVisitShape)
  }

  async getById(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: visitInclude,
    })

    if (!visit) {
      throw new NotFoundException("Visit not found")
    }

    return toVisitShape(visit)
  }

  async create(dto: CreateVisitDto, actorId?: string) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } })
    if (!client) {
      throw new NotFoundException("Client not found")
    }

    const technicianId = dto.technicianId?.trim() ?? ""
    let technicianName = ""
    const scheduledAt = parseScheduledAt(dto.scheduledDate, dto.scheduledTime)
    if (technicianId) {
      const technician = await this.resolveTechnician(technicianId)
      technicianName = technician.name
      if (activeVisitStatuses.includes(dto.status as (typeof activeVisitStatuses)[number])) {
        await this.ensureTechnicianAvailability(technicianId, scheduledAt)
      }
    }

    const visit = await this.prisma.visit.create({
      data: {
        clientId: dto.clientId,
        technicianId,
        technicianName,
        zone: dto.zone.trim(),
        type: dto.type,
        scheduledAt,
        status: dto.status,
        notes: dto.notes?.trim() || null,
      },
      include: visitInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "visits.create",
        entity: "visit",
        entityId: visit.id,
        metadata: {
          technicianId: visit.technicianId,
          scheduledAt: visit.scheduledAt.toISOString(),
          status: visit.status,
        },
      },
    })

    return toVisitShape(visit)
  }

  async update(id: string, dto: UpdateVisitDto, actorId?: string) {
    const existing = await this.prisma.visit.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!existing) {
      throw new NotFoundException("Visit not found")
    }

    this.ensureAllowedStatusTransition(existing.status, dto.status)

    const technicianId = dto.technicianId?.trim() ?? ""
    let technicianName = ""
    const scheduledAt = parseScheduledAt(dto.scheduledDate, dto.scheduledTime)
    if (technicianId) {
      const technician = await this.resolveTechnician(technicianId)
      technicianName = technician.name
      if (activeVisitStatuses.includes(dto.status as (typeof activeVisitStatuses)[number])) {
        await this.ensureTechnicianAvailability(technicianId, scheduledAt, id)
      }
    }

    const visit = await this.prisma.visit.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        technicianId,
        technicianName,
        zone: dto.zone.trim(),
        type: dto.type,
        scheduledAt,
        status: dto.status,
        notes: dto.notes?.trim() || null,
      },
      include: visitInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "visits.update",
        entity: "visit",
        entityId: visit.id,
        metadata: {
          technicianId: visit.technicianId,
          scheduledAt: visit.scheduledAt.toISOString(),
          status: visit.status,
        },
      },
    })

    return toVisitShape(visit)
  }

  async reschedule(id: string, dto: RescheduleVisitDto, actorId?: string) {
    const existing = await this.prisma.visit.findUnique({
      where: { id },
      include: visitInclude,
    })
    if (!existing) {
      throw new NotFoundException("Visit not found")
    }
    if (existing.status === "in_progress") {
      throw new BadRequestException("Cannot reschedule an in-progress visit")
    }

    const scheduledAt = parseScheduledAt(dto.scheduledDate, dto.scheduledTime)
    if (existing.technicianId) {
      await this.resolveTechnician(existing.technicianId)
      await this.ensureTechnicianAvailability(existing.technicianId, scheduledAt, id)
    }

    const visit = await this.prisma.visit.update({
      where: { id },
      data: {
        scheduledAt,
        status: "scheduled",
        notes: dto.notes?.trim() || null,
      },
      include: visitInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "visits.reschedule",
        entity: "visit",
        entityId: visit.id,
        metadata: {
          scheduledAt: visit.scheduledAt.toISOString(),
        },
      },
    })

    return toVisitShape(visit)
  }

  async delete(id: string, actorId?: string) {
    await this.getById(id)
    await this.prisma.visit.delete({
      where: { id },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "visits.delete",
        entity: "visit",
        entityId: id,
      },
    })

    return { ok: true }
  }
}
