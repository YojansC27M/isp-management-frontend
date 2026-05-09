import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService, type JwtSignOptions } from "@nestjs/jwt"
import * as bcrypt from "bcryptjs"
import { randomUUID } from "node:crypto"
import { PrismaService } from "../../common/prisma/prisma.service"
import { defaultPermissionsByRole, getNavigationForPermissions } from "../../common/navigation/navigation.constants"
import type { AuthRefreshResponse, AuthRequestContext, AuthResponse, AuthenticatedUserPayload } from "./auth.types"

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string, context: AuthRequestContext): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissionOverrides: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!user) {
      await this.logAuthEvent("auth.login_failed", null, {
        email,
        reason: "invalid_credentials",
        ip: context.ip,
        userAgent: context.userAgent,
      })
      throw new UnauthorizedException("Invalid credentials")
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatches) {
      await this.logAuthEvent("auth.login_failed", user.id, {
        email,
        reason: "invalid_credentials",
        ip: context.ip,
        userAgent: context.userAgent,
      })
      throw new UnauthorizedException("Invalid credentials")
    }

    const tokenId = randomUUID()
    const permissions = this.resolvePermissions(
      user.role?.key,
      user.role?.permissions.map((entry) => entry.permission.key) ?? [],
      user.permissionOverrides.map((entry) => ({
        key: entry.permission.key,
        granted: entry.granted,
      })),
    )
    const payload: AuthenticatedUserPayload = {
      sub: user.id,
      jti: tokenId,
      email: user.email,
      name: user.name,
      roleKey: user.role?.key ?? "client",
      permissions,
    }

    const expiresIn = (this.configService.get<string>("JWT_EXPIRES_IN") ?? "1d") as JwtSignOptions["expiresIn"]

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      expiresIn,
    })
    const expiresAt = this.resolveTokenExpiryIso(accessToken)

    await this.logAuthEvent("auth.login_succeeded", user.id, {
      email: user.email,
      role: user.role?.key ?? "client",
      tokenId,
      ip: context.ip,
      userAgent: context.userAgent,
    })

    return {
      accessToken,
      tokenType: "Bearer",
      expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.key ?? "client",
        permissions,
      },
    }
  }

  async logout(userId: string, tokenId: string, context: AuthRequestContext) {
    await this.logAuthEvent("auth.token_revoked", userId, {
      tokenId,
      ip: context.ip,
      userAgent: context.userAgent,
      revokedAt: new Date().toISOString(),
    }, "auth_token", tokenId)

    await this.logAuthEvent("auth.logout", userId, {
      tokenId,
      ip: context.ip,
      userAgent: context.userAgent,
      loggedOutAt: new Date().toISOString(),
    })

    return { ok: true }
  }

  async logoutAll(userId: string, tokenIat: number | null | undefined, context: AuthRequestContext) {
    const revokedAfterEpoch = Math.max(Math.floor(Date.now() / 1000), tokenIat ?? 0)

    await this.logAuthEvent(
      "auth.logout_all",
      userId,
      {
        revokedAfterEpoch,
        ip: context.ip,
        userAgent: context.userAgent,
        loggedOutAt: new Date().toISOString(),
      },
      "auth_session_scope",
      userId,
    )

    return { ok: true }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        permissionOverrides: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    const permissions = this.resolvePermissions(
      user.role?.key,
      user.role?.permissions.map((entry) => entry.permission.key) ?? [],
      user.permissionOverrides.map((entry) => ({
        key: entry.permission.key,
        granted: entry.granted,
      })),
    )
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.key ?? "client",
      permissions,
    }
  }

  async refreshMe(userId: string): Promise<AuthRefreshResponse> {
    const user = await this.me(userId)
    return {
      user,
      navigation: this.navigationForPermissions(user.permissions),
    }
  }

  navigationForPermissions(permissions: string[]) {
    return {
      modules: getNavigationForPermissions(permissions),
    }
  }

  async isTokenRevoked(tokenId: string, userId?: string, tokenIat?: number) {
    const revoked = await this.prisma.auditLog.findFirst({
      where: {
        action: "auth.token_revoked",
        entity: "auth_token",
        entityId: tokenId,
      },
      select: { id: true },
    })

    if (revoked) {
      return true
    }

    if (!userId || typeof tokenIat !== "number") {
      return false
    }

    const logoutAllEvent = await this.prisma.auditLog.findFirst({
      where: {
        action: "auth.logout_all",
        entity: "auth_session_scope",
        entityId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        metadata: true,
      },
    })

    const revokedAfterEpoch = this.extractRevokedAfterEpoch(logoutAllEvent?.metadata)
    return typeof revokedAfterEpoch === "number" ? tokenIat <= revokedAfterEpoch : false
  }

  private resolvePermissions(
    roleKey: string | undefined,
    rolePermissions: string[],
    overrides: Array<{ key: string; granted: boolean }>,
  ) {
    if (!roleKey) return []
    const defaultPermissions = defaultPermissionsByRole[roleKey] ?? []
    const allowed = new Set([...defaultPermissions, ...rolePermissions])
    for (const override of overrides) {
      if (override.granted) {
        allowed.add(override.key)
      } else {
        allowed.delete(override.key)
      }
    }
    return Array.from(allowed).sort((left, right) => left.localeCompare(right))
  }

  private async logAuthEvent(
    action: string,
    userId: string | null,
    metadata: Record<string, string | number | boolean | null | undefined>,
    entity = "auth",
    entityId?: string,
  ) {
    const normalizedMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined),
    )

    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: normalizedMetadata,
      },
    })
  }

  private resolveTokenExpiryIso(accessToken: string) {
    const decoded = this.jwtService.decode(accessToken)
    if (!decoded || typeof decoded !== "object") {
      return null
    }

    const rawExp = (decoded as Record<string, unknown>)["exp"]
    if (typeof rawExp !== "number") {
      return null
    }

    return new Date(rawExp * 1000).toISOString()
  }

  private extractRevokedAfterEpoch(metadata: unknown) {
    if (!metadata || typeof metadata !== "object") {
      return null
    }

    const rawValue = (metadata as Record<string, unknown>)["revokedAfterEpoch"]
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      return rawValue
    }
    if (typeof rawValue === "string") {
      const parsed = Number.parseInt(rawValue, 10)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }
    return null
  }
}
