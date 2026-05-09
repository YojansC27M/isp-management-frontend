import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import ExcelJS from "exceljs"
import { PrismaService } from "@/common/prisma/prisma.service"
import { defaultPermissionsByRole } from "../../common/navigation/navigation.constants"
import { SecurityAuditQueryDto } from "./dto/audit-query.dto"

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePermissionKeys(permissions: string[]) {
    return Array.from(
      new Set(
        permissions
          .map((permission) => permission.trim())
          .filter((permission) => permission.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right))
  }

  private async resolvePermissionRows(permissions: string[]) {
    const normalizedKeys = this.normalizePermissionKeys(permissions)
    if (normalizedKeys.length === 0) {
      return {
        normalizedKeys,
        rows: [] as Array<{ id: string; key: string }>,
      }
    }

    const rows = await this.prisma.permission.findMany({
      where: { key: { in: normalizedKeys } },
      select: { id: true, key: true },
    })

    const existingKeys = new Set(rows.map((row) => row.key))
    const invalidKeys = normalizedKeys.filter((key) => !existingKeys.has(key))
    if (invalidKeys.length > 0) {
      throw new BadRequestException(`Unknown permissions: ${invalidKeys.join(", ")}`)
    }

    return {
      normalizedKeys,
      rows,
    }
  }

  getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { label: "asc" }],
    })
  }

  getRoles() {
    return this.prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    })
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundException("Role not found")
    }

    return {
      roleId: role.id,
      permissions: role.permissions.map((entry) => entry.permission.key),
      updatedAt: role.updatedAt,
    }
  }

  async getUserPermissionOverrides(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { key: true, name: true } } },
    })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const overrides = await this.prisma.userPermissionOverride.findMany({
      where: { userId },
      include: { permission: { select: { key: true } } },
    })

    const grants = this.normalizePermissionKeys(
      overrides.filter((item) => item.granted).map((item) => item.permission.key),
    )
    const revokes = this.normalizePermissionKeys(
      overrides.filter((item) => !item.granted).map((item) => item.permission.key),
    )

    return {
      userId,
      roleKey: user.role?.key ?? null,
      roleName: user.role?.name ?? null,
      grants,
      revokes,
      updatedAt: new Date().toISOString(),
    }
  }

  async updateRolePermissions(roleId: string, permissions: string[], actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw new NotFoundException("Role not found")
    }

    const [permissionRows, currentPermissions] = await Promise.all([
      this.resolvePermissionRows(permissions),
      this.prisma.rolePermission.findMany({
        where: { roleId },
        include: {
          permission: {
            select: { key: true },
          },
        },
      }),
    ])

    const currentKeys = this.normalizePermissionKeys(currentPermissions.map((entry) => entry.permission.key))
    const unchanged = currentKeys.length === permissionRows.normalizedKeys.length
      && currentKeys.every((value, index) => value === permissionRows.normalizedKeys[index])

    if (unchanged) {
      await this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "roles.update_permissions.noop",
          entity: "role",
          entityId: roleId,
          metadata: {
            permissions: permissionRows.normalizedKeys,
          },
        },
      })
      return this.getRolePermissions(roleId)
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionRows.rows.map((permission) => ({
          roleId,
          permissionId: permission.id,
        })),
      }),
    ])

    const added = permissionRows.normalizedKeys.filter((key) => !currentKeys.includes(key))
    const removed = currentKeys.filter((key) => !permissionRows.normalizedKeys.includes(key))

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "roles.update_permissions",
        entity: "role",
        entityId: roleId,
        metadata: {
          permissions: permissionRows.normalizedKeys,
          added,
          removed,
        },
      },
    })

    return this.getRolePermissions(roleId)
  }

  async resetRolePermissions(roleId: string, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })
    if (!role) {
      throw new NotFoundException("Role not found")
    }

    const defaultKeys = defaultPermissionsByRole[role.key] ?? []
    const permissionRows = await this.prisma.permission.findMany({
      where: { key: { in: defaultKeys } },
    })

    await this.prisma.rolePermission.deleteMany({ where: { roleId } })
    await this.prisma.rolePermission.createMany({
      data: permissionRows.map((permission) => ({
        roleId,
        permissionId: permission.id,
      })),
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "roles.reset_permissions",
        entity: "role",
        entityId: roleId,
        metadata: { defaultKeys },
      },
    })

    return this.getRolePermissions(roleId)
  }

  async resetAllPermissions(actorId?: string) {
    const roles = await this.prisma.role.findMany()

    for (const role of roles) {
      const defaultKeys = defaultPermissionsByRole[role.key] ?? []
      const permissionRows = await this.prisma.permission.findMany({
        where: { key: { in: defaultKeys } },
      })

      await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
      await this.prisma.rolePermission.createMany({
        data: permissionRows.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      })
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "roles.reset_all_permissions",
        entity: "role",
        metadata: { reset: true },
      },
    })

    return { ok: true }
  }

  async updateUserPermissionOverrides(userId: string, grants: string[], revokes: string[], actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { key: true, name: true } } },
    })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const normalizedGrants = this.normalizePermissionKeys(grants)
    const normalizedRevokes = this.normalizePermissionKeys(revokes)
    const duplicates = normalizedGrants.filter((key) => normalizedRevokes.includes(key))
    if (duplicates.length > 0) {
      throw new BadRequestException(`A permission cannot be grant and revoke at the same time: ${duplicates.join(", ")}`)
    }

    const permissionRows = await this.resolvePermissionRows([...normalizedGrants, ...normalizedRevokes])
    const idByKey = new Map(permissionRows.rows.map((row) => [row.key, row.id]))

    const currentRows = await this.prisma.userPermissionOverride.findMany({
      where: { userId },
      include: { permission: { select: { key: true } } },
    })
    const currentGrants = this.normalizePermissionKeys(
      currentRows.filter((item) => item.granted).map((item) => item.permission.key),
    )
    const currentRevokes = this.normalizePermissionKeys(
      currentRows.filter((item) => !item.granted).map((item) => item.permission.key),
    )

    const unchanged =
      currentGrants.length === normalizedGrants.length &&
      currentRevokes.length === normalizedRevokes.length &&
      currentGrants.every((value, index) => value === normalizedGrants[index]) &&
      currentRevokes.every((value, index) => value === normalizedRevokes[index])

    if (!unchanged) {
      await this.prisma.$transaction(async (tx) => {
        await tx.userPermissionOverride.deleteMany({ where: { userId } })

        const createData = [
          ...normalizedGrants.map((key) => ({
            userId,
            permissionId: idByKey.get(key),
            granted: true,
          })),
          ...normalizedRevokes.map((key) => ({
            userId,
            permissionId: idByKey.get(key),
            granted: false,
          })),
        ].filter((item): item is { userId: string; permissionId: string; granted: boolean } => Boolean(item.permissionId))

        if (createData.length > 0) {
          await tx.userPermissionOverride.createMany({ data: createData })
        }
      })
    }

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: unchanged ? "users.permissions_overrides.update.noop" : "users.permissions_overrides.update",
        entity: "user",
        entityId: userId,
        metadata: {
          grants: normalizedGrants,
          revokes: normalizedRevokes,
          roleKey: user.role?.key ?? null,
        },
      },
    })

    return this.getUserPermissionOverrides(userId)
  }

  private buildAuditWhere(query: SecurityAuditQueryDto): Prisma.AuditLogWhereInput {
    return {
      AND: [
        query.actorId ? { userId: query.actorId } : undefined,
        query.action ? { action: { contains: query.action, mode: "insensitive" } } : undefined,
        query.module
          ? {
              OR: [
                { action: { contains: query.module, mode: "insensitive" } },
                { entity: { contains: query.module, mode: "insensitive" } },
              ],
            }
          : undefined,
        query.dateFrom || query.dateTo
          ? {
              createdAt: {
                gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
                lte: query.dateTo ? new Date(query.dateTo) : undefined,
              },
            }
          : undefined,
      ].filter(Boolean) as Prisma.AuditLogWhereInput[],
    }
  }

  getAudit(query: SecurityAuditQueryDto) {
    if (query.dateFrom && query.dateTo && new Date(query.dateFrom).getTime() > new Date(query.dateTo).getTime()) {
      throw new BadRequestException("dateFrom cannot be greater than dateTo")
    }

    const limit = query.limit ?? 50

    const where = this.buildAuditWhere(query)

    return this.prisma.auditLog.findMany({
      take: limit,
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { include: { role: true } } },
    })
  }

  async getAuditPage(query: SecurityAuditQueryDto) {
    if (query.dateFrom && query.dateTo && new Date(query.dateFrom).getTime() > new Date(query.dateTo).getTime()) {
      throw new BadRequestException("dateFrom cannot be greater than dateTo")
    }

    const page = Math.max(1, query.page ?? 1)
    const perPage = Math.min(100, Math.max(1, query.perPage ?? 25))
    const where = this.buildAuditWhere(query)

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        skip: (page - 1) * perPage,
        take: perPage,
        where,
        orderBy: { createdAt: "desc" },
        include: { user: { include: { role: true } } },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(page, totalPages)

    return {
      items,
      meta: {
        page: safePage,
        perPage,
        total,
        totalPages,
      },
    }
  }

  async exportAuditCsv(query: SecurityAuditQueryDto) {
    const rows = await this.getAudit({
      ...query,
      limit: query.limit ?? 500,
    })

    const escape = (value: string | null | undefined) => {
      const normalized = (value ?? "").replaceAll("\"", "\"\"")
      return `"${normalized}"`
    }

    const lines = [
      "id,createdAt,userId,userEmail,action,entity,entityId",
      ...rows.map((row) =>
        [
          escape(row.id),
          escape(row.createdAt.toISOString()),
          escape(row.userId ?? ""),
          escape(row.user?.email ?? ""),
          escape(row.action),
          escape(row.entity),
          escape(row.entityId ?? ""),
        ].join(","),
      ),
    ]

    return lines.join("\n")
  }

  async exportAudit(
    query: SecurityAuditQueryDto,
    format: "csv" | "json" | "xlsx" = "csv",
  ) {
    const rows = await this.getAudit({
      ...query,
      limit: query.limit ?? 500,
    })
    const datePart = new Date().toISOString().slice(0, 10)

    if (format === "json") {
      return {
        contentType: "application/json; charset=utf-8",
        fileName: `security-audit-${datePart}.json`,
        buffer: Buffer.from(JSON.stringify(rows, null, 2), "utf-8"),
      }
    }

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = "ISP Management"
      workbook.created = new Date()
      const sheet = workbook.addWorksheet("Audit")
      sheet.columns = [
        { header: "ID", key: "id", width: 32 },
        { header: "Fecha", key: "createdAt", width: 24 },
        { header: "Actor ID", key: "userId", width: 24 },
        { header: "Actor Email", key: "userEmail", width: 32 },
        { header: "Accion", key: "action", width: 42 },
        { header: "Entidad", key: "entity", width: 20 },
        { header: "Entidad ID", key: "entityId", width: 24 },
        { header: "Metadata", key: "metadata", width: 60 },
      ]
      sheet.addRows(
        rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt.toISOString(),
          userId: row.userId ?? "",
          userEmail: row.user?.email ?? "",
          action: row.action,
          entity: row.entity,
          entityId: row.entityId ?? "",
          metadata: row.metadata ? JSON.stringify(row.metadata) : "",
        })),
      )
      const buffer = await workbook.xlsx.writeBuffer()
      return {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: `security-audit-${datePart}.xlsx`,
        buffer: Buffer.from(buffer),
      }
    }

    const csv = await this.exportAuditCsv(query)
    return {
      contentType: "text/csv; charset=utf-8",
      fileName: `security-audit-${datePart}.csv`,
      buffer: Buffer.from(csv, "utf-8"),
    }
  }
}
