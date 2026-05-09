import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { PrismaService } from "@/common/prisma/prisma.service"
import { MikrotikService } from "../network/mikrotik/mikrotik.service"
import { CreateRouterDto, ListRoutersQueryDto, TestRouterConnectionDto } from "./dto/router.dto"

type RouterStatus = "online" | "offline"
const ROUTER_BACKUPS_KEY_PREFIX = "router_backups::"
const ENCRYPTED_PREFIX = "enc:v1:"

interface RouterRecord {
  id: string
  name: string
  ip: string
  port: number
  username: string
  password: string
  zone: string
  location: string
  latitude: number | null
  longitude: number | null
  status: RouterStatus
  lastCheckedAt: Date
}

interface RouterBackupEntry {
  id: string
  fileName: string
  createdAt: string
  sizeBytes: number
  checksum: string
  source: "mikrotik" | "manual"
  content: string
}

interface RouterBackupTableRow {
  id: string
  fileName: string
  createdAt: Date
  sizeBytes: number
  checksum: string
  source: string
  content: string
}

const toRouterShape = (router: RouterRecord) => ({
  id: router.id,
  name: router.name,
  ip: router.ip,
  port: router.port,
  username: router.username,
  passwordMasked: "******",
  zone: router.zone,
  location: router.location,
  latitude: router.latitude,
  longitude: router.longitude,
  status: router.status,
  lastCheckedAt: router.lastCheckedAt.toISOString(),
})

const toConnectionResult = (ok: boolean, message: string, latencyMs: number | null) => ({
  success: ok,
  message,
  latencyMs,
  checkedAt: new Date().toISOString(),
})

const resolveEncryptionSecret = () =>
  process.env["APP_ENCRYPTION_KEY"]?.trim()
  || process.env["JWT_SECRET"]?.trim()
  || "local-dev-fallback-key-not-for-production"

const encryptionKey = createHash("sha256").update(resolveEncryptionSecret()).digest()

const encryptValue = (plainText: string) => {
  if (!plainText) return plainText
  if (plainText.startsWith(ENCRYPTED_PREFIX)) return plainText

  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, "utf-8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

const decryptValue = (storedValue: string) => {
  if (!storedValue) return storedValue
  if (!storedValue.startsWith(ENCRYPTED_PREFIX)) return storedValue

  const payload = storedValue.slice(ENCRYPTED_PREFIX.length)
  const [ivRaw, tagRaw, cipherRaw] = payload.split(":")
  if (!ivRaw || !tagRaw || !cipherRaw) {
    throw new Error("Encrypted value format is invalid")
  }

  try {
    const iv = Buffer.from(ivRaw, "base64")
    const tag = Buffer.from(tagRaw, "base64")
    const cipherBytes = Buffer.from(cipherRaw, "base64")
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(cipherBytes), decipher.final()])
    return decrypted.toString("utf-8")
  } catch {
    throw new Error("Unable to decrypt encrypted value")
  }
}

const isMaskedPasswordInput = (value: string) => /^\*{4,}$/.test(value.trim())

@Injectable()
export class RoutersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
  ) {
    const isProduction = process.env["NODE_ENV"] === "production"
    if (isProduction && !process.env["APP_ENCRYPTION_KEY"]?.trim()) {
      throw new Error("APP_ENCRYPTION_KEY is required in production to protect router credentials.")
    }
  }

  private resolveRouterPassword(password: string) {
    try {
      return decryptValue(password)
    } catch {
      throw new InternalServerErrorException("Router credentials could not be decrypted.")
    }
  }

  private routerBackupsKey(routerId: string) {
    return `${ROUTER_BACKUPS_KEY_PREFIX}${routerId}`
  }

  private isUniqueIpConstraintError(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false
    if (error.code !== "P2002") return false

    const target = error.meta?.["target"]
    if (!Array.isArray(target)) return false
    return target.some((field) => String(field).toLowerCase() === "ip")
  }

  private throwDuplicateIpError(ip: string) {
    throw new ConflictException({
      message: "Ya existe un router registrado con esa IP.",
      code: "ROUTER_IP_ALREADY_EXISTS",
      details: [{ field: "ip", message: `La IP ${ip} ya esta en uso.` }],
    })
  }

  private async ensureIpAvailable(ip: string, excludeRouterId?: string) {
    const found = await this.prisma.router.findFirst({
      where: {
        ip,
        ...(excludeRouterId ? { id: { not: excludeRouterId } } : {}),
      },
      select: { id: true },
    })

    if (found) {
      this.throwDuplicateIpError(ip)
    }
  }

  private parseBackupsValue(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) return [] as RouterBackupEntry[]
    return value
      .filter((item) => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      .map((item) => {
        const row = item as Record<string, unknown>
        return {
          id: typeof row["id"] === "string" ? row["id"] : "",
          fileName: typeof row["fileName"] === "string" ? row["fileName"] : "backup.rsc",
          createdAt: typeof row["createdAt"] === "string" ? row["createdAt"] : new Date().toISOString(),
          sizeBytes: typeof row["sizeBytes"] === "number" ? row["sizeBytes"] : 0,
          checksum: typeof row["checksum"] === "string" ? row["checksum"] : "",
          source: row["source"] === "manual" ? "manual" : "mikrotik",
          content: typeof row["content"] === "string" ? row["content"] : "",
        }
      })
      .filter((item) => item.id.length > 0)
  }

  private async loadBackups(routerId: string) {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: this.routerBackupsKey(routerId) },
    })
    return this.parseBackupsValue(row?.value)
  }

  private async tableBackupsAvailable() {
    try {
      await this.prisma.$queryRaw<Array<{ exists: number }>>`
        SELECT 1 as exists FROM "RouterBackup" LIMIT 1
      `
      return true
    } catch {
      return false
    }
  }

  private async loadBackupsFromTable(routerId: string) {
    const available = await this.tableBackupsAvailable()
    if (!available) return [] as RouterBackupEntry[]

    const rows = await this.prisma.$queryRaw<RouterBackupTableRow[]>`
      SELECT id, "fileName", "createdAt", "sizeBytes", checksum, source, content
      FROM "RouterBackup"
      WHERE "routerId" = ${routerId}
      ORDER BY "createdAt" DESC
      LIMIT 30
    `

    return rows.map((row) => ({
      id: row.id,
      fileName: row.fileName,
      createdAt: row.createdAt.toISOString(),
      sizeBytes: row.sizeBytes,
      checksum: row.checksum,
      source: row.source === "manual" ? "manual" : "mikrotik",
      content: row.content,
    }))
  }

  private async persistBackupInTable(routerId: string, backup: RouterBackupEntry) {
    const available = await this.tableBackupsAvailable()
    if (!available) return false

    await this.prisma.$executeRaw`
      INSERT INTO "RouterBackup" (id, "routerId", "fileName", content, "sizeBytes", checksum, source, "createdAt")
      VALUES (${backup.id}, ${routerId}, ${backup.fileName}, ${backup.content}, ${backup.sizeBytes}, ${backup.checksum}, ${backup.source}, ${new Date(backup.createdAt)})
    `

    return true
  }

  private async maybeMigrateLegacyBackups(routerId: string) {
    const available = await this.tableBackupsAvailable()
    if (!available) return

    const existing = await this.loadBackupsFromTable(routerId)
    if (existing.length > 0) return

    const legacy = await this.loadBackups(routerId)
    if (legacy.length === 0) return

    for (const backup of legacy) {
      await this.prisma.$executeRaw`
        INSERT INTO "RouterBackup" (id, "routerId", "fileName", content, "sizeBytes", checksum, source, "createdAt")
        VALUES (${backup.id}, ${routerId}, ${backup.fileName}, ${backup.content}, ${backup.sizeBytes}, ${backup.checksum}, ${backup.source}, ${new Date(backup.createdAt)})
        ON CONFLICT (id) DO NOTHING
      `
    }
  }

  async list(query: ListRoutersQueryDto) {
    const page = query.page ?? 1
    const perPage = query.perPage ?? 500
    const skip = (page - 1) * perPage
    const sortBy = query.sortBy ?? "createdAt"
    const sortDir = query.sortDir ?? (sortBy === "name" || sortBy === "ip" || sortBy === "zone" || sortBy === "status" ? "asc" : "desc")

    const routers = await this.prisma.router.findMany({
      where: {
        AND: [
          query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: "insensitive" } },
                  { ip: { contains: query.search, mode: "insensitive" } },
                  { username: { contains: query.search, mode: "insensitive" } },
                  { zone: { contains: query.search, mode: "insensitive" } },
                ],
              }
            : undefined,
          query.status ? { status: query.status as RouterStatus } : undefined,
          query.zone ? { zone: { contains: query.zone, mode: "insensitive" } } : undefined,
        ].filter(Boolean) as Prisma.RouterWhereInput[],
      },
      skip,
      take: perPage,
      orderBy: [{ [sortBy]: sortDir }],
    })

    return routers.map(toRouterShape)
  }

  async getById(id: string) {
    const router = await this.prisma.router.findUnique({ where: { id } })
    if (!router) {
      throw new NotFoundException("Router not found")
    }
    return toRouterShape(router)
  }

  async create(dto: CreateRouterDto, actorId?: string) {
    const normalizedIp = dto.ip.trim()
    await this.ensureIpAvailable(normalizedIp)
    const connectionProbe = await this.mikrotikService.testConnection({
      host: normalizedIp,
      port: dto.port,
      username: dto.username.trim(),
      password: dto.password,
    })

    let router: RouterRecord
    try {
      router = await this.prisma.router.create({
        data: {
          name: dto.name.trim(),
          ip: normalizedIp,
          port: dto.port,
          username: dto.username.trim(),
          password: encryptValue(dto.password),
          zone: dto.zone.trim(),
          location: dto.location.trim(),
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          status: connectionProbe.ok ? "online" : "offline",
          lastCheckedAt: new Date(),
        },
      })
    } catch (error) {
      if (this.isUniqueIpConstraintError(error)) {
        this.throwDuplicateIpError(normalizedIp)
      }
      throw error
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.create",
        entity: "router",
        entityId: router.id,
        metadata: {
          name: router.name,
          ip: router.ip,
          zone: router.zone,
          connectionOk: connectionProbe.ok,
          connectionMessage: connectionProbe.message,
          latencyMs: connectionProbe.latencyMs ?? null,
        },
      },
    })

    return toRouterShape(router)
  }

  async update(id: string, dto: CreateRouterDto, actorId?: string) {
    const existing = await this.prisma.router.findUnique({
      where: { id },
    })
    if (!existing) {
      throw new NotFoundException("Router not found")
    }

    const normalizedIp = dto.ip.trim()
    await this.ensureIpAvailable(normalizedIp, id)

    const rawPassword = dto.password.trim()
    const nextPassword = rawPassword.length === 0 || isMaskedPasswordInput(rawPassword)
      ? existing.password
      : encryptValue(rawPassword)

    let router: RouterRecord
    try {
      router = await this.prisma.router.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          ip: normalizedIp,
          port: dto.port,
          username: dto.username.trim(),
          password: nextPassword,
          zone: dto.zone.trim(),
          location: dto.location.trim(),
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
        },
      })
    } catch (error) {
      if (this.isUniqueIpConstraintError(error)) {
        this.throwDuplicateIpError(normalizedIp)
      }
      throw error
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.update",
        entity: "router",
        entityId: router.id,
        metadata: {
          name: router.name,
          ip: router.ip,
          zone: router.zone,
        },
      },
    })

    return toRouterShape(router)
  }

  async remove(id: string, actorId?: string) {
    const existing = await this.getById(id)
    await this.prisma.router.delete({ where: { id } })
    await this.prisma.systemSetting.deleteMany({ where: { key: this.routerBackupsKey(id) } })
    if (await this.tableBackupsAvailable()) {
      await this.prisma.$executeRaw`
        DELETE FROM "RouterBackup" WHERE "routerId" = ${id}
      `
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.delete",
        entity: "router",
        entityId: id,
        metadata: {
          name: existing.name,
          ip: existing.ip,
          zone: existing.zone,
        },
      },
    })

    return { ok: true }
  }

  async testConnection(payload: TestRouterConnectionDto, actorId?: string) {
    const rawPassword = payload.password.trim()
    const result = await this.mikrotikService.testConnection({
      host: payload.ip.trim(),
      port: payload.port,
      username: payload.username.trim(),
      password: isMaskedPasswordInput(rawPassword) ? "" : rawPassword,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.test_connection",
        entity: "router_connection_probe",
        metadata: {
          host: payload.ip.trim(),
          port: payload.port,
          success: result.ok,
          latencyMs: result.latencyMs ?? null,
        },
      },
    })

    return toConnectionResult(result.ok, result.message, result.latencyMs ?? null)
  }

  async testConnectionById(id: string, actorId?: string) {
    const router = await this.prisma.router.findUnique({ where: { id } })
    if (!router) {
      throw new NotFoundException("Router not found")
    }

    const result = await this.mikrotikService.testConnection({
      host: router.ip,
      port: router.port,
      username: router.username,
      password: this.resolveRouterPassword(router.password),
    })

    await this.prisma.router.update({
      where: { id },
      data: {
        status: result.ok ? "online" : "offline",
        lastCheckedAt: new Date(),
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.test_connection",
        entity: "router",
        entityId: id,
        metadata: {
          success: result.ok,
          latencyMs: result.latencyMs ?? null,
        },
      },
    })

    return toConnectionResult(result.ok, result.message, result.latencyMs ?? null)
  }

  async getHealth(id: string) {
    const router = await this.prisma.router.findUnique({ where: { id } })
    if (!router) {
      throw new NotFoundException("Router not found")
    }

    try {
      const [health, interfaces] = await Promise.all([
        this.mikrotikService.getHealth(id, {
          host: router.ip,
          port: router.port,
          username: router.username,
          password: this.resolveRouterPassword(router.password),
        }),
        this.mikrotikService.getInterfaces(id, {
          host: router.ip,
          port: router.port,
          username: router.username,
          password: this.resolveRouterPassword(router.password),
        }),
      ])

      const interfacesUp = interfaces.filter((item) => item.status === "up").length
      const interfacesDown = interfaces.length - interfacesUp
      const totalThroughput = interfaces.reduce((sum, item) => sum + item.rxMbps + item.txMbps, 0)

      await this.prisma.router.update({
        where: { id },
        data: {
          status: health.status,
          lastCheckedAt: new Date(),
        },
      })

      return {
        cpuUsage: health.cpu,
        ramUsage: health.ram,
        uptime: `${Math.floor(health.uptimeSeconds / 3600)}h`,
        interfacesUp,
        interfacesDown,
        throughput: `${Math.round(totalThroughput)} Mbps`,
      }
    } catch {
      await this.prisma.router.update({
        where: { id },
        data: {
          status: "offline",
          lastCheckedAt: new Date(),
        },
      })

      return {
        cpuUsage: 0,
        ramUsage: 0,
        uptime: "0h",
        interfacesUp: 0,
        interfacesDown: 0,
        throughput: "0 Mbps",
      }
    }
  }

  async listBackups(id: string) {
    await this.getById(id)
    await this.maybeMigrateLegacyBackups(id)
    const tableBackups = await this.loadBackupsFromTable(id)
    const legacyBackups = await this.loadBackups(id)
    const merged = [...tableBackups]
    const seenIds = new Set(tableBackups.map((item) => item.id))
    for (const backup of legacyBackups) {
      if (seenIds.has(backup.id)) continue
      merged.push(backup)
    }

    return merged
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 30)
      .map((item) => ({
        id: item.id,
        fileName: item.fileName,
        createdAt: item.createdAt,
        sizeBytes: item.sizeBytes,
        checksum: item.checksum,
        source: item.source,
      }))
  }

  async createBackup(id: string, actorId?: string) {
    const router = await this.prisma.router.findUnique({ where: { id } })
    if (!router) {
      throw new NotFoundException("Router not found")
    }

    const snapshot = await this.mikrotikService.createBackupSnapshot(id, {
      host: router.ip,
      port: router.port,
      username: router.username,
      password: this.resolveRouterPassword(router.password),
    })

    const entry: RouterBackupEntry = {
      id: randomUUID(),
      fileName: snapshot.fileName,
      createdAt: snapshot.createdAt,
      sizeBytes: snapshot.sizeBytes,
      checksum: snapshot.checksum,
      source: "mikrotik",
      content: encryptValue(snapshot.content),
    }

    const persistedInTable = await this.persistBackupInTable(id, entry)
    if (!persistedInTable) {
      const backups = await this.loadBackups(id)
      const next = [entry, ...backups].slice(0, 30)
      await this.prisma.systemSetting.upsert({
        where: { key: this.routerBackupsKey(id) },
        create: {
          key: this.routerBackupsKey(id),
          value: next as unknown as Prisma.JsonArray,
        },
        update: {
          value: next as unknown as Prisma.JsonArray,
        },
      })
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.backup.create",
        entity: "router_backup",
        entityId: entry.id,
        metadata: {
          routerId: id,
          fileName: entry.fileName,
          sizeBytes: entry.sizeBytes,
          checksum: entry.checksum,
        },
      },
    })

    return {
      id: entry.id,
      fileName: entry.fileName,
      createdAt: entry.createdAt,
      sizeBytes: entry.sizeBytes,
      checksum: entry.checksum,
      source: entry.source,
    }
  }

  async downloadBackup(id: string, backupId: string, actorId?: string) {
    await this.getById(id)
    await this.maybeMigrateLegacyBackups(id)
    const tableBackups = await this.loadBackupsFromTable(id)
    const legacyBackups = await this.loadBackups(id)
    const backup = [...tableBackups, ...legacyBackups].find((item) => item.id === backupId)
    if (!backup) {
      throw new NotFoundException("Backup not found")
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "routers.backup.download",
        entity: "router_backup",
        entityId: backup.id,
        metadata: {
          routerId: id,
          fileName: backup.fileName,
          sizeBytes: backup.sizeBytes,
        },
      },
    })

    return {
      fileName: backup.fileName,
      buffer: Buffer.from(this.resolveRouterPassword(backup.content), "utf-8"),
    }
  }
}
