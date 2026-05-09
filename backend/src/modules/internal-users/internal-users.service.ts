import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma, Role, User } from "@prisma/client"
import * as bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateInternalUserDto, ListInternalUsersQueryDto, UpdateInternalUserDto } from "./dto/internal-user.dto"

type InternalUserRole = "admin" | "staff" | "technician" | "support"
type InternalUserStatus = "active" | "inactive"

interface TechnicianAvailabilitySlot {
  id: string
  label: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface TechnicianProfile {
  coverageZones: string[]
  availability: TechnicianAvailabilitySlot[]
  skills: string[]
}

interface InternalUserProfileValue {
  documentType: string
  documentNumber: string
  phone: string
  status: InternalUserStatus
  technicianProfile: TechnicianProfile | null
}

type InternalUserRecord = User & { role: Role | null }
type PrismaErrorWithCode = { code?: string }

const INTERNAL_USER_ROLE_KEYS: InternalUserRole[] = ["admin", "staff", "technician", "support"]
const PROFILE_KEY_PREFIX = "internal_user_profile::"

const isInternalUserRole = (value: unknown): value is InternalUserRole =>
  typeof value === "string" && INTERNAL_USER_ROLE_KEYS.includes(value as InternalUserRole)

const isInternalUserStatus = (value: unknown): value is InternalUserStatus => value === "active" || value === "inactive"
const profileKey = (userId: string) => `${PROFILE_KEY_PREFIX}${userId}`

const normalizeTextArray = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)))

const toMinutes = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(":")
  const hours = Number.parseInt(hoursRaw ?? "", 10)
  const minutes = Number.parseInt(minutesRaw ?? "", 10)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const parseProfileValue = (value: Prisma.JsonValue | null): InternalUserProfileValue => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      documentType: "CC",
      documentNumber: "",
      phone: "",
      status: "active",
      technicianProfile: null,
    }
  }

  const json = value as Record<string, unknown>
  const rawDocumentType = json["documentType"]
  const documentType = typeof rawDocumentType === "string" && rawDocumentType.trim().length > 0 ? rawDocumentType.trim().toUpperCase() : "CC"
  const documentNumber = typeof json["documentNumber"] === "string" ? json["documentNumber"] : ""
  const phone = typeof json["phone"] === "string" ? json["phone"] : ""
  const rawStatus = json["status"]
  const status: InternalUserStatus = isInternalUserStatus(rawStatus) ? rawStatus : "active"
  const rawTechnicianProfile = json["technicianProfile"]

  if (!rawTechnicianProfile || typeof rawTechnicianProfile !== "object" || Array.isArray(rawTechnicianProfile)) {
    return {
      documentType,
      documentNumber,
      phone,
      status,
      technicianProfile: null,
    }
  }

  const profileObject = rawTechnicianProfile as Record<string, unknown>
  const coverageZones = Array.isArray(profileObject["coverageZones"])
    ? profileObject["coverageZones"].filter((item): item is string => typeof item === "string")
    : []
  const skills = Array.isArray(profileObject["skills"]) ? profileObject["skills"].filter((item): item is string => typeof item === "string") : []
  const availability = Array.isArray(profileObject["availability"])
    ? profileObject["availability"]
        .filter((slot): slot is Record<string, unknown> => Boolean(slot) && typeof slot === "object" && !Array.isArray(slot))
        .map((slot) => ({
          id: typeof slot["id"] === "string" ? slot["id"] : "",
          label: typeof slot["label"] === "string" ? slot["label"] : "",
          dayOfWeek: typeof slot["dayOfWeek"] === "number" ? slot["dayOfWeek"] : 0,
          startTime: typeof slot["startTime"] === "string" ? slot["startTime"] : "00:00",
          endTime: typeof slot["endTime"] === "string" ? slot["endTime"] : "00:00",
        }))
        .filter((slot) => slot.id && slot.label)
    : []

  return {
    documentType,
    documentNumber,
    phone,
    status,
    technicianProfile: {
      coverageZones: normalizeTextArray(coverageZones),
      availability,
      skills: normalizeTextArray(skills),
    },
  }
}

@Injectable()
export class InternalUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveRole(roleKey: InternalUserRole) {
    if (roleKey === "staff") {
      return this.prisma.role.upsert({
        where: { key: "staff" },
        update: {
          name: "Staff",
          description: "Personal interno de operacion general",
          isSystem: true,
        },
        create: {
          key: "staff",
          name: "Staff",
          description: "Personal interno de operacion general",
          isSystem: true,
        },
      })
    }

    const role = await this.prisma.role.findUnique({
      where: { key: roleKey },
    })
    if (!role) {
      throw new BadRequestException(`Role '${roleKey}' is not available`)
    }
    return role
  }

  private isUniqueConstraintError(error: unknown) {
    return typeof error === "object" && error !== null && (error as PrismaErrorWithCode).code === "P2002"
  }

  private sanitizeTechnicianProfile(dto: CreateInternalUserDto | UpdateInternalUserDto) {
    if (dto.role !== "technician") return null
    if (!dto.technicianProfile) {
      throw new BadRequestException("Technician profile is required for technician role")
    }

    const seenAvailabilitySlots = new Set<string>()
    const sanitizedAvailability = dto.technicianProfile.availability.map((slot) => {
      const id = slot.id.trim()
      const label = slot.label.trim()
      const startTime = slot.startTime.trim()
      const endTime = slot.endTime.trim()
      const slotKey = `${slot.dayOfWeek}:${startTime}:${endTime}`
      const startMinutes = toMinutes(startTime)
      const endMinutes = toMinutes(endTime)

      if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
        throw new BadRequestException(`Invalid technician availability slot '${id || label || "unknown"}'`)
      }
      if (!id || !label) {
        throw new BadRequestException("Technician availability slot id and label are required")
      }
      if (seenAvailabilitySlots.has(slotKey)) {
        throw new BadRequestException("Duplicated technician availability slot detected")
      }
      seenAvailabilitySlots.add(slotKey)

      return {
        id,
        label,
        dayOfWeek: slot.dayOfWeek,
        startTime,
        endTime,
      }
    })

    return {
      coverageZones: normalizeTextArray(dto.technicianProfile.coverageZones),
      skills: normalizeTextArray(dto.technicianProfile.skills),
      availability: sanitizedAvailability,
    }
  }

  private toProfileValue(dto: CreateInternalUserDto | UpdateInternalUserDto): InternalUserProfileValue {
    return {
      documentType: dto.documentType.trim().toUpperCase(),
      documentNumber: dto.documentNumber.trim(),
      phone: dto.phone.trim(),
      status: dto.status,
      technicianProfile: this.sanitizeTechnicianProfile(dto),
    }
  }

  private toApiShape(user: InternalUserRecord, profile: InternalUserProfileValue) {
    const roleKey = user.role?.key
    if (!isInternalUserRole(roleKey)) {
      throw new NotFoundException("Internal user not found")
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      documentType: profile.documentType,
      documentNumber: profile.documentNumber,
      phone: profile.phone,
      role: roleKey,
      status: profile.status,
      technicianProfile: roleKey === "technician" ? profile.technicianProfile : null,
    }
  }

  private async getProfilesByUserIds(userIds: string[]) {
    if (userIds.length === 0) return new Map<string, InternalUserProfileValue>()

    const profileRows = await this.prisma.systemSetting.findMany({
      where: {
        key: {
          in: userIds.map((userId) => profileKey(userId)),
        },
      },
    })

    const map = new Map<string, InternalUserProfileValue>()
    for (const row of profileRows) {
      if (!row.key.startsWith(PROFILE_KEY_PREFIX)) continue
      const userId = row.key.slice(PROFILE_KEY_PREFIX.length)
      map.set(userId, parseProfileValue(row.value))
    }
    return map
  }

  private async getInternalUserRecord(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    })
    if (!user || !isInternalUserRole(user.role?.key)) {
      throw new NotFoundException("Internal user not found")
    }
    return user
  }

  async list(query: ListInternalUsersQueryDto) {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 25
    const skip = (page - 1) * perPage
    const search = query.search?.trim()

    let allowedUserIdsByStatus: string[] | null = null
    if (query.status) {
      const profileRows = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            startsWith: PROFILE_KEY_PREFIX,
          },
          value: {
            path: ["status"],
            equals: query.status,
          },
        },
        select: {
          key: true,
        },
      })

      allowedUserIdsByStatus = profileRows
        .map((row) => (row.key.startsWith(PROFILE_KEY_PREFIX) ? row.key.slice(PROFILE_KEY_PREFIX.length) : ""))
        .filter((id) => id.length > 0)
    }

    const isCursorMode = Boolean(query.cursor) || Boolean(query.limit)
    const effectiveLimit = query.limit ?? perPage

    if (query.status && allowedUserIdsByStatus && allowedUserIdsByStatus.length === 0) {
      if (isCursorMode) {
        return {
          items: [],
          meta: {
            mode: "cursor",
            limit: effectiveLimit,
            hasNext: false,
            nextCursor: null,
          },
        }
      }

      return {
        items: [],
        meta: {
          mode: "offset",
          page,
          perPage,
          total: 0,
          totalPages: 1,
        },
      }
    }

    const where: Prisma.UserWhereInput = {
      AND: [
        {
          role: {
            key: {
              in: INTERNAL_USER_ROLE_KEYS,
            },
          },
        },
        query.role
          ? {
              role: {
                key: query.role,
              },
            }
          : undefined,
        search
          ? {
              OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }],
            }
          : undefined,
        allowedUserIdsByStatus ? { id: { in: allowedUserIdsByStatus } } : undefined,
      ].filter(Boolean) as Prisma.UserWhereInput[],
    }

    if (isCursorMode) {
      const limit = Math.min(Math.max(1, effectiveLimit), 100)
      if (query.cursor) {
        const cursorExists = await this.prisma.user.findUnique({
          where: { id: query.cursor },
          select: { id: true },
        })
        if (!cursorExists) {
          throw new BadRequestException("Invalid cursor")
        }
      }

      const rawUsers = await this.prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        cursor: query.cursor ? { id: query.cursor } : undefined,
        skip: query.cursor ? 1 : 0,
        take: limit + 1,
      })

      const hasNext = rawUsers.length > limit
      const users = hasNext ? rawUsers.slice(0, limit) : rawUsers
      const profileByUserId = await this.getProfilesByUserIds(users.map((user) => user.id))
      const items = users.map((user) => {
        const profile = profileByUserId.get(user.id) ?? {
          documentType: "CC",
          documentNumber: "",
          phone: "",
          status: "active" as InternalUserStatus,
          technicianProfile: null,
        }
        return this.toApiShape(user, profile)
      })
      const nextCursor = hasNext && users.length > 0 ? users[users.length - 1]?.id ?? null : null

      return {
        items,
        meta: {
          mode: "cursor",
          limit,
          hasNext,
          nextCursor,
        },
      }
    }

    const sortBy = query.sortBy ?? "createdAt"
    const sortDir = query.sortDir ?? (sortBy === "createdAt" ? "desc" : "asc")

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === "role" ? { role: { key: sortDir } } : { [sortBy]: sortDir }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          role: true,
        },
        orderBy,
        skip,
        take: perPage,
      }),
    ])

    const profileByUserId = await this.getProfilesByUserIds(users.map((user) => user.id))
    const items = users.map((user) => {
      const profile = profileByUserId.get(user.id) ?? {
        documentType: "CC",
        documentNumber: "",
        phone: "",
        status: "active" as InternalUserStatus,
        technicianProfile: null,
      }
      return this.toApiShape(user, profile)
    })

    return {
      items,
      meta: {
        mode: "offset",
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    }
  }

  async getById(id: string) {
    const user = await this.getInternalUserRecord(id)
    const profileSetting = await this.prisma.systemSetting.findUnique({
      where: { key: profileKey(id) },
    })

    return this.toApiShape(user, parseProfileValue(profileSetting?.value ?? null))
  }

  async create(dto: CreateInternalUserDto, actorId?: string) {
    const documentTypeCode = dto.documentType.trim().toUpperCase()
    const activeDocumentType = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "DocumentType" WHERE "code" = $1 AND "active" = true LIMIT 1`,
      documentTypeCode,
    )
    if (activeDocumentType.length === 0) {
      throw new BadRequestException(`Document type '${documentTypeCode}' is not available`)
    }

    const role = await this.resolveRole(dto.role)
    const temporaryPassword = randomUUID()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    let created: InternalUserRecord
    try {
      created = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          roleId: role.id,
        },
        include: {
          role: true,
        },
      })
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new BadRequestException("Email already in use")
      }
      throw error
    }

    const profileValue = this.toProfileValue(dto)
    await this.prisma.systemSetting.upsert({
      where: { key: profileKey(created.id) },
      create: {
        key: profileKey(created.id),
        value: profileValue as unknown as Prisma.JsonObject,
      },
      update: {
        value: profileValue as unknown as Prisma.JsonObject,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "internal_users.create",
        entity: "internal_user",
        entityId: created.id,
        metadata: {
          email: created.email,
          role: created.role?.key ?? dto.role,
          status: profileValue.status,
        },
      },
    })

    return this.toApiShape(created, profileValue)
  }

  async update(id: string, dto: UpdateInternalUserDto, actorId?: string) {
    const documentTypeCode = dto.documentType.trim().toUpperCase()
    const activeDocumentType = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "DocumentType" WHERE "code" = $1 AND "active" = true LIMIT 1`,
      documentTypeCode,
    )
    if (activeDocumentType.length === 0) {
      throw new BadRequestException(`Document type '${documentTypeCode}' is not available`)
    }

    await this.getInternalUserRecord(id)
    const role = await this.resolveRole(dto.role)

    let updated: InternalUserRecord
    try {
      updated = await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          roleId: role.id,
        },
        include: {
          role: true,
        },
      })
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new BadRequestException("Email already in use")
      }
      throw error
    }

    const profileValue = this.toProfileValue(dto)
    await this.prisma.systemSetting.upsert({
      where: { key: profileKey(id) },
      create: {
        key: profileKey(id),
        value: profileValue as unknown as Prisma.JsonObject,
      },
      update: {
        value: profileValue as unknown as Prisma.JsonObject,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "internal_users.update",
        entity: "internal_user",
        entityId: updated.id,
        metadata: {
          email: updated.email,
          role: updated.role?.key ?? dto.role,
          status: profileValue.status,
        },
      },
    })

    return this.toApiShape(updated, profileValue)
  }

  async delete(id: string, actorId?: string) {
    if (actorId && id === actorId) {
      throw new ForbiddenException("You cannot delete your own user")
    }

    await this.getInternalUserRecord(id)

    await this.prisma.$transaction([
      this.prisma.systemSetting.deleteMany({
        where: { key: profileKey(id) },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "internal_users.delete",
          entity: "internal_user",
          entityId: id,
        },
      }),
      this.prisma.user.delete({
        where: { id },
      }),
    ])

    return { ok: true }
  }
}
