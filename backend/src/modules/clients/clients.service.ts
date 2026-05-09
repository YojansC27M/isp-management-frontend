import { Injectable, NotFoundException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Prisma } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateClientDto, ListClientsQueryDto, UpdateClientDto } from "./dto/client.dto"

const clientInclude = {
  plan: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      payments: true,
      invoices: true,
      tickets: true,
      visits: true,
    },
  },
} as const
const PORTAL_PASSWORD_POLICY_KEY_PREFIX = "portal_password_policy::"
const portalPasswordPolicyKey = (userId: string) => `${PORTAL_PASSWORD_POLICY_KEY_PREFIX}${userId}`

const toClientResponse = (client: Prisma.ClientGetPayload<{ include: typeof clientInclude }>) => ({
  id: client.id,
  name: client.name,
  email: client.email,
  document: client.document,
  phone: client.phone,
  address: client.address,
  planId: client.planId,
  plan: client.plan?.name ?? "",
  ipAddress: client.ipAddress,
  latitude: client.latitude,
  longitude: client.longitude,
  status: client.status,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
  _count: client._count,
})

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  list(query: ListClientsQueryDto) {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 500
    const skip = (page - 1) * perPage

    const sortMap: Record<NonNullable<ListClientsQueryDto["sortBy"]>, Prisma.SortOrder> = {
      createdAt: query.sortDir ?? "desc",
      name: query.sortDir ?? "asc",
      status: query.sortDir ?? "asc",
    }
    const sortBy = query.sortBy ?? "createdAt"

    const where: Prisma.ClientWhereInput = {
      AND: [
        query.search?.trim()
          ? {
              OR: [
                { name: { contains: query.search.trim(), mode: "insensitive" } },
                { document: { contains: query.search.trim(), mode: "insensitive" } },
                { phone: { contains: query.search.trim(), mode: "insensitive" } },
                { email: { contains: query.search.trim(), mode: "insensitive" } },
                { ipAddress: { contains: query.search.trim(), mode: "insensitive" } },
              ],
            }
          : undefined,
        query.status ? { status: query.status } : undefined,
      ].filter(Boolean) as Prisma.ClientWhereInput[],
    }

    return this.prisma.client
      .findMany({
      where,
      skip,
      take: perPage,
      orderBy: [{ [sortBy]: sortMap[sortBy] }],
      include: clientInclude,
    })
      .then((rows) => rows.map(toClientResponse))
  }

  search(query: string, limit = 20) {
    const normalized = query.trim()
    if (normalized.length < 2) return []

    return this.prisma.client
      .findMany({
      where: {
        OR: [
          { name: { contains: normalized, mode: "insensitive" } },
          { document: { contains: normalized, mode: "insensitive" } },
          { phone: { contains: normalized, mode: "insensitive" } },
          { email: { contains: normalized, mode: "insensitive" } },
          { ipAddress: { contains: normalized, mode: "insensitive" } },
        ],
      },
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: [{ name: "asc" }],
      include: clientInclude,
    })
      .then((rows) => rows.map(toClientResponse))
  }

  async getById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: clientInclude,
    })

    if (!client) {
      throw new NotFoundException("Client not found")
    }

    return toClientResponse(client)
  }

  async create(dto: CreateClientDto, actorId?: string) {
    await this.ensurePlanExists(dto.planId)
    const created = await this.prisma.client.create({
      data: {
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        document: dto.document?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        planId: dto.planId.trim(),
        ipAddress: dto.ipAddress.trim(),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        status: dto.status,
      },
      include: clientInclude,
    })
    await this.syncClientPortalUser(created.id, created.name, created.email)

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "clients.create",
        entity: "client",
        entityId: created.id,
        metadata: {
          name: created.name,
          email: created.email,
          planId: created.planId,
          status: created.status,
        },
      },
    })

    return toClientResponse(created)
  }

  async update(id: string, dto: UpdateClientDto, actorId?: string) {
    await this.getById(id)
    await this.ensurePlanExists(dto.planId)
    const updated = await this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        email: dto.email?.trim() || null,
        document: dto.document?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        planId: dto.planId.trim(),
        ipAddress: dto.ipAddress.trim(),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        status: dto.status,
      },
      include: clientInclude,
    })
    await this.syncClientPortalUser(updated.id, updated.name, updated.email)

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "clients.update",
        entity: "client",
        entityId: updated.id,
        metadata: {
          name: updated.name,
          email: updated.email,
          planId: updated.planId,
          status: updated.status,
        },
      },
    })

    return toClientResponse(updated)
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id)
    await this.prisma.client.delete({ where: { id } })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "clients.delete",
        entity: "client",
        entityId: id,
        metadata: {
          name: existing.name,
          email: existing.email,
          planId: existing.planId,
          status: existing.status,
        },
      },
    })

    return { ok: true }
  }

  private async ensurePlanExists(planId: string) {
    const normalized = planId.trim()
    const plan = await this.prisma.plan.findUnique({
      where: { id: normalized },
      select: { id: true, active: true },
    })
    if (!plan || !plan.active) {
      throw new NotFoundException("Plan not found")
    }
  }

  private async syncClientPortalUser(clientId: string, clientName: string, clientEmail: string | null) {
    if (!clientEmail) return

    const normalizedEmail = clientEmail.trim().toLowerCase()
    if (!normalizedEmail) return

    const clientRole = await this.prisma.role.upsert({
      where: { key: "client" },
      update: {
        name: "Cliente",
        description: "Acceso al portal de cliente",
        isSystem: true,
      },
      create: {
        key: "client",
        name: "Cliente",
        description: "Acceso al portal de cliente",
        isSystem: true,
      },
    })

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { role: true },
    })

    if (existingUser) {
      if (existingUser.role?.key === "client") {
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: clientName.trim(),
            roleId: clientRole.id,
          },
        })
      } else {
        await this.prisma.auditLog.create({
          data: {
            action: "clients.portal_user_sync_skipped",
            entity: "client",
            entityId: clientId,
            metadata: {
              email: normalizedEmail,
              reason: "email_owned_by_non_client_user",
              ownerRole: existingUser.role?.key ?? "unknown",
            },
          },
        })
      }
      return
    }

    const defaultPassword = this.configService.get<string>("CLIENT_PORTAL_DEFAULT_PASSWORD")?.trim() || "ChangeMe123!"
    const passwordHash = await bcrypt.hash(defaultPassword, 12)

    const createdUser = await this.prisma.user.create({
      data: {
        name: clientName.trim(),
        email: normalizedEmail,
        passwordHash,
        roleId: clientRole.id,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        action: "clients.portal_user_provisioned",
        entity: "client",
        entityId: clientId,
        metadata: {
          clientId,
          userId: createdUser.id,
          email: normalizedEmail,
          defaultPasswordConfigured: Boolean(this.configService.get<string>("CLIENT_PORTAL_DEFAULT_PASSWORD")?.trim()),
        },
      },
    })

    await this.prisma.systemSetting.upsert({
      where: { key: portalPasswordPolicyKey(createdUser.id) },
      create: {
        key: portalPasswordPolicyKey(createdUser.id),
        value: {
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        },
      },
      update: {
        value: {
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        },
      },
    })
  }
}
