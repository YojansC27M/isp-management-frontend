import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreatePlanDto, ListPlansQueryDto, UpdatePlanDto } from "./dto/plan.dto"

type PlanType = "residential" | "business"

const PLAN_TYPE_KEY_PREFIX = "plan_type::"

const isPlanType = (value: unknown): value is PlanType => value === "residential" || value === "business"
const toNumber = (value: Prisma.Decimal | number) => Number(value)
const planTypeKey = (planId: string) => `${PLAN_TYPE_KEY_PREFIX}${planId}`

const resolvePlanTypeFromSetting = (value: unknown): PlanType => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "residential"
  const rawType = (value as { type?: unknown }).type
  return isPlanType(rawType) ? rawType : "residential"
}

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  private async listMapped(query: ListPlansQueryDto) {
    const sortDir = query.sortDir ?? (query.sortBy === "name" ? "asc" : "desc")
    const sortFieldMap: Record<NonNullable<ListPlansQueryDto["sortBy"]>, "createdAt" | "name" | "price" | "speedDown" | "speedUp"> = {
      createdAt: "createdAt",
      name: "name",
      price: "price",
      downloadSpeed: "speedDown",
      uploadSpeed: "speedUp",
    }
    const sortBy = sortFieldMap[query.sortBy ?? "createdAt"]

    const plans = await this.prisma.plan.findMany({
      where: query.search?.trim()
        ? {
            name: {
              contains: query.search.trim(),
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: [{ [sortBy]: sortDir }],
    })
    const typeByPlanId = await this.loadPlanTypes(plans.map((plan) => plan.id))

    const mapped = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      downloadSpeed: plan.speedDown,
      uploadSpeed: plan.speedUp,
      price: toNumber(plan.price),
      type: typeByPlanId.get(plan.id) ?? "residential",
    }))

    return query.type ? mapped.filter((plan) => plan.type === query.type) : mapped
  }

  private async loadPlanTypes(planIds: string[]) {
    if (planIds.length === 0) return new Map<string, PlanType>()

    const rows = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: planIds.map((planId) => planTypeKey(planId)),
        },
      },
    })

    const map = new Map<string, PlanType>()
    for (const row of rows) {
      if (!row.key.startsWith(PLAN_TYPE_KEY_PREFIX)) continue
      const planId = row.key.slice(PLAN_TYPE_KEY_PREFIX.length)
      map.set(planId, resolvePlanTypeFromSetting(row.value))
    }
    return map
  }

  async list(query: ListPlansQueryDto) {
    return this.listMapped(query)
  }

  async listPage(query: ListPlansQueryDto) {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 25
    const skip = (page - 1) * perPage

    const filtered = await this.listMapped(query)
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const safeSkip = (safePage - 1) * perPage

    return {
      items: filtered.slice(safeSkip, safeSkip + perPage),
      meta: {
        page: safePage,
        perPage,
        total,
        totalPages,
      },
    }
  }

  async getById(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } })
    if (!plan) {
      throw new NotFoundException("Plan not found")
    }

    const planTypeRow = await this.prisma.systemSetting.findUnique({
      where: { key: planTypeKey(id) },
    })

    return {
      id: plan.id,
      name: plan.name,
      downloadSpeed: plan.speedDown,
      uploadSpeed: plan.speedUp,
      price: toNumber(plan.price),
      type: resolvePlanTypeFromSetting(planTypeRow?.value),
    }
  }

  async create(dto: CreatePlanDto, actorId?: string) {
    const created = await this.prisma.plan.create({
      data: {
        name: dto.name.trim(),
        speedDown: dto.downloadSpeed,
        speedUp: dto.uploadSpeed,
        price: new Prisma.Decimal(dto.price),
        active: true,
      },
    })

    await this.prisma.systemSetting.upsert({
      where: { key: planTypeKey(created.id) },
      create: {
        key: planTypeKey(created.id),
        value: { type: dto.type },
      },
      update: {
        value: { type: dto.type },
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "plans.create",
        entity: "plan",
        entityId: created.id,
        metadata: {
          name: created.name,
          speedDown: created.speedDown,
          speedUp: created.speedUp,
          price: toNumber(created.price),
          type: dto.type,
        },
      },
    })

    return {
      id: created.id,
      name: created.name,
      downloadSpeed: created.speedDown,
      uploadSpeed: created.speedUp,
      price: toNumber(created.price),
      type: dto.type,
    }
  }

  async update(id: string, dto: UpdatePlanDto, actorId?: string) {
    await this.getById(id)

    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        speedDown: dto.downloadSpeed,
        speedUp: dto.uploadSpeed,
        price: new Prisma.Decimal(dto.price),
      },
    })

    await this.prisma.systemSetting.upsert({
      where: { key: planTypeKey(id) },
      create: {
        key: planTypeKey(id),
        value: { type: dto.type },
      },
      update: {
        value: { type: dto.type },
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "plans.update",
        entity: "plan",
        entityId: id,
        metadata: {
          name: updated.name,
          speedDown: updated.speedDown,
          speedUp: updated.speedUp,
          price: toNumber(updated.price),
          type: dto.type,
        },
      },
    })

    return {
      id: updated.id,
      name: updated.name,
      downloadSpeed: updated.speedDown,
      uploadSpeed: updated.speedUp,
      price: toNumber(updated.price),
      type: dto.type,
    }
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id)

    await this.prisma.$transaction([
      this.prisma.systemSetting.deleteMany({ where: { key: planTypeKey(id) } }),
      this.prisma.plan.delete({ where: { id } }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "plans.delete",
          entity: "plan",
          entityId: id,
          metadata: {
            name: existing.name,
            type: existing.type,
          },
        },
      }),
    ])

    return { ok: true }
  }
}
