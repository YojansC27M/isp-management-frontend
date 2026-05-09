import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateInstallationDto, UpdateInstallationDto } from "./dto/installation.dto"

const installationInclude = {
  client: {
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      status: true,
      plan: {
        select: {
          name: true,
        },
      },
    },
  },
  visit: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      type: true,
    },
  },
  router: {
    select: {
      id: true,
      name: true,
      ip: true,
      zone: true,
      location: true,
      status: true,
    },
  },
} as const

const movementInclude = {
  client: {
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      status: true,
      plan: {
        select: {
          name: true,
        },
      },
    },
  },
  installation: {
    select: {
      id: true,
    },
  },
  visit: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      type: true,
    },
  },
  router: {
    select: {
      id: true,
      name: true,
      ip: true,
      zone: true,
      location: true,
      status: true,
    },
  },
} as const

type InstallationRecord = Prisma.InstallationGetPayload<{ include: typeof installationInclude }>
type InstallationMovementRecord = Prisma.InstallationMovementGetPayload<{ include: typeof movementInclude }>
type InstallationStatus = "pending" | "scheduled" | "installed" | "suspended" | "canceled"
type InstallationOperationType = "installation" | "relocation" | "replacement" | "removal"

const toDateTime = (value: Date | null | undefined) => (value ? value.toISOString() : null)

const toInstallationShape = (installation: InstallationRecord) => ({
  id: installation.id,
  clientId: installation.clientId,
  clientName: installation.client.name,
  clientPhone: installation.client.phone ?? "",
  clientAddress: installation.client.address ?? "",
  clientStatus: installation.client.status,
  clientPlan: installation.client.plan?.name ?? "",
  visitId: installation.visitId,
  visitType: installation.visit?.type ?? "",
  visitStatus: installation.visit?.status ?? "",
  visitScheduledAt: toDateTime(installation.visit?.scheduledAt),
  routerId: installation.routerId,
  routerName: installation.router?.name ?? "",
  routerIp: installation.router?.ip ?? "",
  routerZone: installation.router?.zone ?? "",
  routerLocation: installation.router?.location ?? "",
  routerStatus: installation.router?.status ?? "",
  operationType: installation.operationType as InstallationOperationType,
  status: installation.status as InstallationStatus,
  installedAt: toDateTime(installation.installedAt),
  notes: installation.notes ?? "",
  createdAt: installation.createdAt.toISOString(),
  updatedAt: installation.updatedAt.toISOString(),
})

const toMovementShape = (movement: InstallationMovementRecord) => ({
  id: movement.id,
  clientId: movement.clientId,
  clientName: movement.client.name,
  clientPhone: movement.client.phone ?? "",
  clientAddress: movement.client.address ?? "",
  clientStatus: movement.client.status,
  clientPlan: movement.client.plan?.name ?? "",
  installationId: movement.installationId,
  visitId: movement.visitId,
  visitType: movement.visit?.type ?? "",
  visitStatus: movement.visit?.status ?? "",
  visitScheduledAt: toDateTime(movement.visit?.scheduledAt),
  routerId: movement.routerId,
  routerName: movement.router?.name ?? "",
  routerIp: movement.router?.ip ?? "",
  routerZone: movement.router?.zone ?? "",
  routerLocation: movement.router?.location ?? "",
  routerStatus: movement.router?.status ?? "",
  operationType: movement.operationType as InstallationOperationType,
  status: movement.status as InstallationStatus,
  notes: movement.notes ?? "",
  happenedAt: movement.happenedAt.toISOString(),
  createdAt: movement.createdAt.toISOString(),
})

@Injectable()
export class InstallationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async createMovement(
    data: {
      clientId: string
      installationId?: string | null
      visitId?: string | null
      routerId?: string | null
      operationType: InstallationOperationType
      status: InstallationStatus
      notes?: string | null
      happenedAt?: Date | null
    },
    transaction?: Prisma.TransactionClient,
  ) {
    const db = transaction ?? this.prisma
    const movement = await db.installationMovement.create({
      data: {
        clientId: data.clientId,
        installationId: data.installationId ?? null,
        visitId: data.visitId ?? null,
        routerId: data.routerId ?? null,
        operationType: data.operationType,
        status: data.status,
        notes: data.notes ?? null,
        happenedAt: data.happenedAt ?? new Date(),
      },
      include: movementInclude,
    })
    return toMovementShape(movement)
  }

  private async loadClient(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId }, select: { id: true } })
    if (!client) throw new NotFoundException("Client not found")
    return client
  }

  private async loadVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      select: { id: true, clientId: true, status: true },
    })
    if (!visit) throw new NotFoundException("Visit not found")
    return visit
  }

  private async loadRouter(routerId: string) {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
      select: { id: true },
    })
    if (!router) throw new NotFoundException("Router not found")
    return router
  }

  private normalizeStatus(value?: string | null): InstallationStatus {
    if (value === "scheduled" || value === "installed" || value === "suspended" || value === "canceled") return value
    return "pending"
  }

  private normalizeStatusFilter(value?: string | null) {
    if (value === "pending" || value === "scheduled" || value === "installed" || value === "suspended" || value === "canceled") {
      return value
    }
    return null
  }

  private normalizeOperationType(value?: string | null): InstallationOperationType {
    if (value === "relocation" || value === "replacement" || value === "removal") return value
    return "installation"
  }

  private normalizeOperationTypeFilter(value?: string | null) {
    if (value === "installation" || value === "relocation" || value === "replacement" || value === "removal") {
      return value
    }
    return null
  }

  private resolveInstalledAt(status: InstallationStatus, installedAt?: string) {
    if (installedAt) return new Date(installedAt)
    if (status === "installed") return new Date()
    return null
  }

  async getById(id: string) {
    const installation = await this.prisma.installation.findUnique({
      where: { id },
      include: installationInclude,
    })
    if (!installation) throw new NotFoundException("Installation not found")
    return toInstallationShape(installation)
  }

  async getByClient(clientId: string) {
    await this.loadClient(clientId)
    const installation = await this.prisma.installation.findUnique({
      where: { clientId },
      include: installationInclude,
    })
    return installation ? toInstallationShape(installation) : null
  }

  async getByRouter(routerId: string) {
    await this.loadRouter(routerId)
    const installations = await this.prisma.installation.findMany({
      where: { routerId },
      orderBy: [{ updatedAt: "desc" }],
      include: installationInclude,
    })
    return installations.map(toInstallationShape)
  }

  async getMovementsByClient(clientId: string) {
    await this.loadClient(clientId)
    const movements = await this.prisma.installationMovement.findMany({
      where: { clientId },
      orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
      include: movementInclude,
    })
    return movements.map(toMovementShape)
  }

  async list(query?: {
    search?: string
    clientId?: string
    routerId?: string
    visitId?: string
    status?: string
    operationType?: string
  }) {
    const search = query?.search?.trim() ?? ""
    const clientId = query?.clientId?.trim() ?? ""
    const routerId = query?.routerId?.trim() ?? ""
    const visitId = query?.visitId?.trim() ?? ""
    const status = this.normalizeStatusFilter(query?.status)
    const operationType = this.normalizeOperationTypeFilter(query?.operationType)

    const installations = await this.prisma.installation.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(routerId ? { routerId } : {}),
        ...(visitId ? { visitId } : {}),
        ...(status ? { status } : {}),
        ...(operationType ? { operationType } : {}),
        ...(search
          ? {
              OR: [
                { notes: { contains: search, mode: "insensitive" } },
                { client: { name: { contains: search, mode: "insensitive" } } },
                { client: { phone: { contains: search, mode: "insensitive" } } },
                { router: { name: { contains: search, mode: "insensitive" } } },
                { router: { ip: { contains: search, mode: "insensitive" } } },
                { visit: { zone: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: installationInclude,
    })

    return installations.map(toInstallationShape)
  }

  async create(dto: CreateInstallationDto, actorId?: string) {
    const clientId = dto.clientId.trim()
    await this.loadClient(clientId)
    const operationType = this.normalizeOperationType(dto.operationType)
    const status = this.normalizeStatus(dto.status)
    const installedAt = this.resolveInstalledAt(status, dto.installedAt)
    const notes = dto.notes?.trim() || null

    if (dto.visitId) {
      const visit = await this.loadVisit(dto.visitId)
      if (visit.clientId !== clientId) {
        throw new BadRequestException("The visit does not belong to the selected client")
      }
    }

    if (dto.routerId) {
      await this.loadRouter(dto.routerId)
    }

    const existing = await this.prisma.installation.findUnique({
      where: { clientId },
      select: { id: true },
    })
    if (existing) {
      throw new ConflictException("The client already has an installation record")
    }

    const installation = await this.prisma.$transaction(async (tx) => {
      const createdInstallation = await tx.installation.create({
        data: {
          clientId,
          visitId: dto.visitId?.trim() || null,
          routerId: dto.routerId?.trim() || null,
          operationType,
          status,
          installedAt,
          notes,
        },
        include: installationInclude,
      })

      await this.createMovement(
        {
          clientId,
          installationId: createdInstallation.id,
          visitId: createdInstallation.visitId,
          routerId: createdInstallation.routerId,
          operationType,
          status,
          notes,
          happenedAt: createdInstallation.installedAt ?? undefined,
        },
        tx,
      )

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "installations.create",
          entity: "installation",
          entityId: createdInstallation.id,
          metadata: {
            clientId: createdInstallation.clientId,
            visitId: createdInstallation.visitId,
            routerId: createdInstallation.routerId,
            operationType: createdInstallation.operationType,
            status: createdInstallation.status,
          },
        },
      })

      return createdInstallation
    })

    return toInstallationShape(installation)
  }

  async update(id: string, dto: UpdateInstallationDto, actorId?: string) {
    const existing = await this.prisma.installation.findUnique({
      where: { id },
      select: { id: true, clientId: true },
    })
    if (!existing) throw new NotFoundException("Installation not found")

    const clientId = dto.clientId.trim()
    await this.loadClient(clientId)
    const operationType = this.normalizeOperationType(dto.operationType)
    const status = this.normalizeStatus(dto.status)
    const installedAt = this.resolveInstalledAt(status, dto.installedAt)
    const notes = dto.notes?.trim() || null

    const conflictingInstallation = await this.prisma.installation.findFirst({
      where: {
        clientId,
        id: { not: id },
      },
      select: { id: true },
    })
    if (conflictingInstallation) {
      throw new ConflictException("The client already has an installation record")
    }

    if (dto.visitId) {
      const visit = await this.loadVisit(dto.visitId)
      if (visit.clientId !== clientId) {
        throw new BadRequestException("The visit does not belong to the selected client")
      }
    }

    if (dto.routerId) {
      await this.loadRouter(dto.routerId)
    }

    const installation = await this.prisma.$transaction(async (tx) => {
      const updatedInstallation = await tx.installation.update({
        where: { id },
        data: {
          clientId,
          visitId: dto.visitId?.trim() || null,
          routerId: dto.routerId?.trim() || null,
          operationType,
          status,
          installedAt,
          notes,
        },
        include: installationInclude,
      })

      await this.createMovement(
        {
          clientId,
          installationId: updatedInstallation.id,
          visitId: updatedInstallation.visitId,
          routerId: updatedInstallation.routerId,
          operationType,
          status,
          notes,
          happenedAt: updatedInstallation.updatedAt,
        },
        tx,
      )

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "installations.update",
          entity: "installation",
          entityId: updatedInstallation.id,
          metadata: {
            clientId: updatedInstallation.clientId,
            visitId: updatedInstallation.visitId,
            routerId: updatedInstallation.routerId,
            operationType: updatedInstallation.operationType,
            status: updatedInstallation.status,
          },
        },
      })

      return updatedInstallation
    })

    return toInstallationShape(installation)
  }

  async delete(id: string, actorId?: string) {
    const current = await this.getById(id)
    await this.prisma.$transaction(async (tx) => {
      await this.createMovement(
        {
          clientId: current.clientId,
          installationId: id,
          visitId: current.visitId,
          routerId: current.routerId,
          operationType: "removal",
          status: "canceled",
          notes: current.notes || "Registro eliminado",
        },
        tx,
      )

      await tx.installation.delete({ where: { id } })

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: "installations.delete",
          entity: "installation",
          entityId: id,
        },
      })
    })

    return { ok: true }
  }
}
