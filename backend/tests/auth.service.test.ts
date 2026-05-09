import { UnauthorizedException } from "@nestjs/common"
import { describe, expect, it, vi, beforeEach } from "vitest"
import * as bcrypt from "bcryptjs"
import { AuthService } from "../src/modules/auth/auth.service"

const buildBaseUser = () => ({
  id: "usr-1",
  name: "Admin User",
  email: "admin@isp.com",
  passwordHash: bcrypt.hashSync("secret", 8),
  role: {
    key: "admin",
    permissions: [
      { permission: { key: "clients.read" } },
      { permission: { key: "clients.write" } },
    ],
  },
  permissionOverrides: [],
})

describe("AuthService", () => {
  let prismaMock: any
  let jwtMock: any
  let configMock: any
  let service: AuthService

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-1" }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    }

    jwtMock = {
      signAsync: vi.fn().mockResolvedValue("token-value"),
      decode: vi.fn().mockReturnValue({ exp: 1_800_000_000 }),
    }

    configMock = {
      get: vi.fn().mockReturnValue("1d"),
      getOrThrow: vi.fn().mockReturnValue("jwt-secret"),
    }

    service = new AuthService(prismaMock, jwtMock, configMock)
  })

  it("returns expiresAt in login response", async () => {
    prismaMock.user.findUnique.mockResolvedValue(buildBaseUser())

    const result = await service.login("admin@isp.com", "secret", {
      ip: "127.0.0.1",
      userAgent: "vitest",
    })

    expect(result.accessToken).toBe("token-value")
    expect(result.expiresAt).toBe("2027-01-15T08:00:00.000Z")
    expect(result.user.email).toBe("admin@isp.com")
  })

  it("stores login_failed audit event for invalid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    await expect(
      service.login("admin@isp.com", "bad-pass", {
        ip: "127.0.0.1",
        userAgent: "vitest",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.login_failed",
        }),
      }),
    )
  })

  it("revokes token if logout-all cutoff is newer than token iat", async () => {
    prismaMock.auditLog.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        metadata: { revokedAfterEpoch: 2_000 },
      })

    const revoked = await service.isTokenRevoked("token-1", "usr-1", 1_900)

    expect(revoked).toBe(true)
  })

  it("returns false when there is no revoke event", async () => {
    prismaMock.auditLog.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const revoked = await service.isTokenRevoked("token-1", "usr-1", 1_900)

    expect(revoked).toBe(false)
  })

  it("creates logout-all audit event", async () => {
    await service.logoutAll("usr-1", 1_500, {
      ip: "127.0.0.1",
      userAgent: "vitest",
    })

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "auth.logout_all",
          entity: "auth_session_scope",
          entityId: "usr-1",
        }),
      }),
    )
  })
})
