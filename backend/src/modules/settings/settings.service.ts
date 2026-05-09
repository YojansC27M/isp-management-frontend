import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"
import {
  CreateDocumentTypeDto,
  ListDocumentTypesQueryDto,
  UpdateDocumentTypeDto,
  UploadSystemLogoDto,
  UpdateSystemSettingsDto,
} from "./dto/system-settings.dto"
import { randomUUID } from "node:crypto"

interface SystemSettingsShape {
  companyName: string
  tradeName: string
  taxId: string
  billingEmail: string
  billingPhone: string
  address: string
  currency: string
  timezone: string
  invoicePrefix: string
  logoUrl: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  legalFooter: string
}

interface DocumentTypeRow {
  id: string
  code: string
  name: string
  active: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

interface CountRow {
  total: bigint | number | string
}

const SETTINGS_KEY = "system"
const INTERNAL_USER_PROFILE_KEY_PREFIX = "internal_user_profile::"

const defaultSettings: SystemSettingsShape = {
  companyName: "Corma Networks S.A.S.",
  tradeName: "Corma ISP",
  taxId: "901.234.567-8",
  billingEmail: "facturacion@corma.net",
  billingPhone: "+57 601 555 2200",
  address: "Av. 19 #102-33, Bogota",
  currency: "COP",
  timezone: "America/Bogota",
  invoicePrefix: "COR",
  logoUrl: "https://placehold.co/240x120/png?text=Corma+ISP",
  brandPrimaryColor: "#0f172a",
  brandSecondaryColor: "#e2e8f0",
  legalFooter: "Este documento es informativo y fue generado automaticamente desde la plataforma.",
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDocumentTypes(query: ListDocumentTypesQueryDto = {}) {
    const includeInactive = query.includeInactive === true
    const status = query.status ?? "all"
    const search = query.search?.trim().toLowerCase() ?? ""
    const page = Math.max(1, query.page ?? 1)
    const perPage = Math.min(100, Math.max(1, query.perPage ?? 25))
    const params: Array<string | number | boolean> = []
    const where: string[] = []

    if (status === "active") {
      where.push(`"active" = true`)
    } else if (status === "inactive") {
      where.push(`"active" = false`)
    } else if (!includeInactive) {
      where.push(`"active" = true`)
    }

    if (search.length > 0) {
      params.push(`%${search}%`)
      const index = params.length
      where.push(`(LOWER("code") LIKE $${index} OR LOWER("name") LIKE $${index})`)
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""

    const countRows = await this.prisma.$queryRawUnsafe<CountRow[]>(
      `SELECT COUNT(*)::bigint AS "total"
       FROM "DocumentType"
       ${whereClause}`,
      ...params,
    )
    const totalRaw = countRows[0]?.total ?? 0
    const total = Number(totalRaw)
    const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0
    const totalPages = Math.max(1, Math.ceil(safeTotal / perPage))
    const boundedPage = Math.min(page, totalPages)
    const offset = (boundedPage - 1) * perPage

    const items = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `SELECT "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"
       FROM "DocumentType"
       ${whereClause}
       ORDER BY "isSystem" DESC, "code" ASC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      ...params,
      perPage,
      offset,
    )

    return {
      items,
      meta: {
        page: boundedPage,
        perPage,
        total: safeTotal,
        totalPages,
      },
    }
  }

  async createDocumentType(payload: CreateDocumentTypeDto, actorId?: string) {
    const code = payload.code.trim().toUpperCase()
    const name = payload.name.trim()

    const exists = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "DocumentType" WHERE "code" = $1 LIMIT 1`,
      code,
    )
    if (exists.length > 0) {
      throw new BadRequestException("Document type code already exists")
    }

    const nextId = randomUUID()
    const createdRows = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `INSERT INTO "DocumentType" ("id", "code", "name", "active", "isSystem", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, false, NOW(), NOW())
       RETURNING "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"`,
      nextId,
      code,
      name,
    )
    const created = createdRows[0]
    if (!created) {
      throw new BadRequestException("Could not create document type")
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "settings.document_types.create",
        entity: "document_type",
        entityId: created.id,
        metadata: {
          code: created.code,
          name: created.name,
        },
      },
    })

    return created
  }

  async updateDocumentType(id: string, payload: UpdateDocumentTypeDto, actorId?: string) {
    const currentRows = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `SELECT "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"
       FROM "DocumentType"
       WHERE "id" = $1
       LIMIT 1`,
      id,
    )
    const current = currentRows[0]
    if (!current) {
      throw new NotFoundException("Document type not found")
    }

    if (current.isSystem && payload.active === false) {
      throw new BadRequestException("System document type cannot be deactivated")
    }

    const name = payload.name.trim()
    const active = payload.active ?? current.active

    if (!active && current.active) {
      const inUse = await this.prisma.systemSetting.findFirst({
        where: {
          key: {
            startsWith: INTERNAL_USER_PROFILE_KEY_PREFIX,
          },
          value: {
            path: ["documentType"],
            equals: current.code,
          },
        },
        select: { id: true },
      })
      if (inUse) {
        throw new BadRequestException("Document type is in use by internal users")
      }
    }

    const updatedRows = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `UPDATE "DocumentType"
       SET "name" = $2, "active" = $3, "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"`,
      id,
      name,
      active,
    )
    const updated = updatedRows[0]
    if (!updated) {
      throw new NotFoundException("Document type not found")
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "settings.document_types.update",
        entity: "document_type",
        entityId: updated.id,
        metadata: {
          code: updated.code,
          name: updated.name,
          active: updated.active,
        },
      },
    })

    return updated
  }

  async deactivateDocumentType(id: string, actorId?: string) {
    const currentRows = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `SELECT "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"
       FROM "DocumentType"
       WHERE "id" = $1
       LIMIT 1`,
      id,
    )
    const current = currentRows[0]
    if (!current) {
      throw new NotFoundException("Document type not found")
    }
    if (current.isSystem) {
      throw new BadRequestException("System document type cannot be deactivated")
    }
    if (!current.active) {
      return current
    }

    const inUse = await this.prisma.systemSetting.findFirst({
      where: {
        key: {
          startsWith: INTERNAL_USER_PROFILE_KEY_PREFIX,
        },
        value: {
          path: ["documentType"],
          equals: current.code,
        },
      },
      select: { id: true },
    })
    if (inUse) {
      throw new BadRequestException("Document type is in use by internal users")
    }

    const updatedRows = await this.prisma.$queryRawUnsafe<DocumentTypeRow[]>(
      `UPDATE "DocumentType"
       SET "active" = false, "updatedAt" = NOW()
       WHERE "id" = $1
       RETURNING "id", "code", "name", "active", "isSystem", "createdAt", "updatedAt"`,
      id,
    )
    const updated = updatedRows[0]
    if (!updated) {
      throw new NotFoundException("Document type not found")
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "settings.document_types.deactivate",
        entity: "document_type",
        entityId: updated.id,
        metadata: {
          code: updated.code,
          name: updated.name,
        },
      },
    })

    return updated
  }

  async getSystemSettings() {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    })

    if (!row || !row.value || typeof row.value !== "object") {
      return defaultSettings
    }

    return { ...defaultSettings, ...(row.value as object) } as SystemSettingsShape
  }

  async updateSystemSettings(payload: UpdateSystemSettingsDto, actorId?: string) {
    const nextValue = {
      companyName: payload.companyName.trim(),
      tradeName: payload.tradeName.trim(),
      taxId: payload.taxId.trim(),
      billingEmail: payload.billingEmail.trim().toLowerCase(),
      billingPhone: payload.billingPhone.trim(),
      address: payload.address.trim(),
      currency: payload.currency.trim().toUpperCase(),
      timezone: payload.timezone.trim(),
      invoicePrefix: payload.invoicePrefix.trim().toUpperCase(),
      logoUrl: payload.logoUrl.trim(),
      brandPrimaryColor: payload.brandPrimaryColor.trim(),
      brandSecondaryColor: payload.brandSecondaryColor.trim(),
      legalFooter: payload.legalFooter.trim(),
    } satisfies SystemSettingsShape

    await this.prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: {
        value: nextValue,
      },
      create: {
        key: SETTINGS_KEY,
        value: nextValue,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "settings.system.update",
        entity: "system_setting",
        entityId: SETTINGS_KEY,
        metadata: {
          companyName: nextValue.companyName,
          billingEmail: nextValue.billingEmail,
          currency: nextValue.currency,
          timezone: nextValue.timezone,
          invoicePrefix: nextValue.invoicePrefix,
          brandPrimaryColor: nextValue.brandPrimaryColor,
          brandSecondaryColor: nextValue.brandSecondaryColor,
        },
      },
    })

    return nextValue
  }

  async uploadSystemLogo(payload: UploadSystemLogoDto, actorId?: string) {
    const current = await this.getSystemSettings()
    const logoDataUrl = payload.dataUrl.trim()
    const allowedPrefixes = ["data:image/png;base64,", "data:image/jpeg;base64,", "data:image/jpg;base64,", "data:image/webp;base64,"]
    const isAllowed = allowedPrefixes.some((prefix) => logoDataUrl.startsWith(prefix))
    if (!isAllowed) {
      throw new BadRequestException("Unsupported logo format. Use PNG, JPG, or WEBP.")
    }

    const base64Part = logoDataUrl.split(",", 2)[1] ?? ""
    const approxSizeBytes = Math.floor((base64Part.length * 3) / 4)
    const maxSizeBytes = 2 * 1024 * 1024
    if (approxSizeBytes > maxSizeBytes) {
      throw new BadRequestException("Logo file is too large. Maximum size is 2 MB.")
    }

    const logoUrl = logoDataUrl
    const next = { ...current, logoUrl }

    await this.prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: next },
      create: { key: SETTINGS_KEY, value: next },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "settings.system.logo.update",
        entity: "system_setting",
        entityId: SETTINGS_KEY,
        metadata: {
          fileName: payload.fileName,
          logoUrl,
          sizeBytes: approxSizeBytes,
        },
      },
    })

    return { logoUrl }
  }
}
