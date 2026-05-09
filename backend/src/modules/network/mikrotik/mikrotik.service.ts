import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createDecipheriv, createHash } from "node:crypto"
import * as http from "node:http"
import * as https from "node:https"

export interface MikrotikConnectionConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface MikrotikConnectionResult {
  ok: boolean
  message: string
  latencyMs?: number
}

export interface MikrotikInterfaceSnapshot {
  name: string
  status: "up" | "down"
  rxMbps: number
  txMbps: number
}

export interface MikrotikBackupSnapshot {
  fileName: string
  content: string
  sizeBytes: number
  checksum: string
  createdAt: string
}

type MikrotikMode = "mock" | "live"
const ENCRYPTED_PREFIX = "enc:v1:"

@Injectable()
export class MikrotikService {
  private readonly logger = new Logger(MikrotikService.name)
  private readonly mode: MikrotikMode
  private readonly defaultHost?: string
  private readonly defaultPort: number
  private readonly defaultUser?: string
  private readonly defaultPassword?: string
  private readonly defaultUseSsl: boolean
  private readonly tlsRejectUnauthorized: boolean
  private readonly encryptionKey: Buffer

  constructor(private readonly configService: ConfigService) {
    const mode = (this.configService.get<string>("MIKROTIK_MODE") ?? "live").toLowerCase()
    this.mode = mode === "live" ? "live" : "mock"
    this.defaultHost = this.configService.get<string>("MIKROTIK_HOST")
    this.defaultPort = Number(this.configService.get<string>("MIKROTIK_PORT") ?? "80")
    this.defaultUser = this.configService.get<string>("MIKROTIK_USER")
    this.defaultPassword = this.configService.get<string>("MIKROTIK_PASSWORD")
    this.defaultUseSsl = this.parseBoolean(this.configService.get<string>("MIKROTIK_USE_SSL"), false)
    this.tlsRejectUnauthorized = this.parseBoolean(
      this.configService.get<string>("MIKROTIK_TLS_REJECT_UNAUTHORIZED"),
      false,
    )
    this.encryptionKey = createHash("sha256").update(this.resolveEncryptionSecret()).digest()
  }

  async testConnection(config: MikrotikConnectionConfig): Promise<MikrotikConnectionResult> {
    this.logger.log(`Testing MikroTik connection against ${config.host}:${config.port} in mode=${this.mode}`)

    if (this.mode === "mock") {
      return {
        ok: true,
        message: "Connection validated (mock)",
        latencyMs: 42,
      }
    }

    const startedAt = Date.now()
    try {
      await this.requestJson("/system/resource", config)
      return {
        ok: true,
        message: "REST connection established",
        latencyMs: Date.now() - startedAt,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown MikroTik connection error"
      return {
        ok: false,
        message: `Connection failed: ${message}`,
      }
    }
  }

  async getHealth(routerId: string, config?: MikrotikConnectionConfig) {
    if (this.mode === "live") {
      const resource = await this.requestJson<Record<string, unknown>>("/system/resource", config)
      const totalMemory = this.toNumber(resource["total-memory"])
      const freeMemory = this.toNumber(resource["free-memory"])
      const usedMemory = Math.max(totalMemory - freeMemory, 0)
      const ramUsage = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0

      return {
        routerId,
        status: "online" as const,
        cpu: this.toNumber(resource["cpu-load"]),
        ram: ramUsage,
        uptimeSeconds: this.parseRouterOsUptime(String(resource["uptime"] ?? "0s")),
      }
    }

    return {
      routerId,
      status: "online" as const,
      cpu: 12,
      ram: 48,
      uptimeSeconds: 123_456,
    }
  }

  async getInterfaces(routerId: string, config?: MikrotikConnectionConfig): Promise<MikrotikInterfaceSnapshot[]> {
    if (this.mode === "live") {
      const interfaces = await this.requestJson<Array<Record<string, unknown>>>("/interface", config)
      return interfaces.map((item) => {
        const status = this.toBoolean(item["running"]) && !this.toBoolean(item["disabled"]) ? "up" : "down"
        return {
          name: String(item["name"] ?? "unknown"),
          status,
          rxMbps: this.toRateMbps(item["rx-bits-per-second"]),
          txMbps: this.toRateMbps(item["tx-bits-per-second"]),
        }
      })
    }

    const seed = Array.from(routerId).reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const base = (seed % 40) + 20
    const wifiUp = seed % 3 !== 0

    return [
      { name: "ether1-uplink", status: "up", rxMbps: base + 35, txMbps: base + 12 },
      { name: "ether2-lan", status: "up", rxMbps: base + 18, txMbps: base + 9 },
      { name: "wlan1", status: wifiUp ? "up" : "down", rxMbps: wifiUp ? base + 7 : 0, txMbps: wifiUp ? base + 3 : 0 },
    ]
  }

  async createBackupSnapshot(routerId: string, config: MikrotikConnectionConfig): Promise<MikrotikBackupSnapshot> {
    const createdAt = new Date().toISOString()
    const safeHost = config.host.trim()
    const safeUser = config.username.trim()
    const fileName = `router-${routerId}-backup-${createdAt.slice(0, 10)}.rsc`

    if (this.mode === "live") {
      await this.requestJson("/system/resource", config)
    }

    const content = [
      `# Router backup`,
      `# routerId=${routerId}`,
      `# host=${safeHost}`,
      `# generatedAt=${createdAt}`,
      `/system identity print`,
      `/interface print detail`,
      `/ip address print detail`,
      `/ip route print detail`,
      `/user print`,
      `# generatedBy=${safeUser}`,
    ].join("\n")

    const sizeBytes = Buffer.byteLength(content, "utf-8")
    const checksum = createHash("sha256").update(content).digest("hex")

    return {
      fileName,
      content,
      sizeBytes,
      checksum,
      createdAt,
    }
  }

  private resolveConfig(config?: MikrotikConnectionConfig): MikrotikConnectionConfig {
    const host = config?.host?.trim() || this.defaultHost?.trim()
    const username = config?.username?.trim() || this.defaultUser?.trim()
    const password = config?.password?.trim() || this.defaultPassword?.trim()
    const port = Number(config?.port ?? this.defaultPort)

    if (!host || !username || !password || !Number.isFinite(port)) {
      throw new Error("Missing MikroTik connection parameters (host/port/username/password)")
    }

    return {
      host,
      port,
      username,
      password: this.decryptPasswordIfNeeded(password),
    }
  }

  private async requestJson<T = unknown>(path: string, config?: MikrotikConnectionConfig): Promise<T> {
    const resolved = this.resolveConfig(config)
    const useSsl = this.defaultUseSsl || resolved.port === 443 || resolved.port === 8443
    const client = useSsl ? https : http
    const timeoutMs = 5000
    const normalizedPath = path.startsWith("/rest/") ? path : `/rest${path}`
    const auth = Buffer.from(`${resolved.username}:${resolved.password}`, "utf-8").toString("base64")

    return new Promise<T>((resolve, reject) => {
      const request = client.request(
        {
          host: resolved.host,
          port: resolved.port,
          method: "GET",
          path: normalizedPath,
          timeout: timeoutMs,
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
          ...(useSsl ? { rejectUnauthorized: this.tlsRejectUnauthorized } : {}),
        },
        (response) => {
          const chunks: Buffer[] = []
          response.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
          response.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf-8")
            const payload = raw.length > 0 ? raw : "{}"
            if ((response.statusCode ?? 500) >= 400) {
              reject(new Error(`HTTP ${response.statusCode}: ${payload}`))
              return
            }

            try {
              resolve(JSON.parse(payload) as T)
            } catch {
              reject(new Error("Invalid JSON response from MikroTik REST API"))
            }
          })
        },
      )

      request.on("timeout", () => {
        request.destroy()
        reject(new Error(`Request timed out after ${timeoutMs}ms`))
      })

      request.on("error", (error) => {
        reject(error)
      })

      request.end()
    })
  }

  private parseBoolean(value: string | undefined, fallback: boolean) {
    if (typeof value !== "string") return fallback
    const normalized = value.trim().toLowerCase()
    if (["1", "true", "yes", "on"].includes(normalized)) return true
    if (["0", "false", "no", "off"].includes(normalized)) return false
    return fallback
  }

  private toBoolean(value: unknown) {
    if (typeof value === "boolean") return value
    if (typeof value === "number") return value > 0
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase()
      return ["1", "true", "yes", "on", "running"].includes(normalized)
    }
    return false
  }

  private toNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
    return 0
  }

  private toRateMbps(value: unknown) {
    const bitsPerSecond = this.toNumber(value)
    if (bitsPerSecond <= 0) return 0
    return Number((bitsPerSecond / 1_000_000).toFixed(2))
  }

  private parseRouterOsUptime(value: string) {
    const segments = Array.from(value.matchAll(/(\d+)([wdhms])/g))
    if (segments.length === 0) return 0

    return segments.reduce((total, segment) => {
      const amount = Number(segment[1] ?? 0)
      const unit = segment[2]
      if (!Number.isFinite(amount)) return total
      if (unit === "w") return total + amount * 7 * 24 * 3600
      if (unit === "d") return total + amount * 24 * 3600
      if (unit === "h") return total + amount * 3600
      if (unit === "m") return total + amount * 60
      if (unit === "s") return total + amount
      return total
    }, 0)
  }

  private resolveEncryptionSecret() {
    return (
      this.configService.get<string>("APP_ENCRYPTION_KEY")?.trim()
      || this.configService.get<string>("JWT_SECRET")?.trim()
      || "local-dev-fallback-key-not-for-production"
    )
  }

  private decryptPasswordIfNeeded(value: string) {
    if (!value.startsWith(ENCRYPTED_PREFIX)) return value

    const payload = value.slice(ENCRYPTED_PREFIX.length)
    const [ivRaw, tagRaw, cipherRaw] = payload.split(":")
    if (!ivRaw || !tagRaw || !cipherRaw) return value

    try {
      const iv = Buffer.from(ivRaw, "base64")
      const tag = Buffer.from(tagRaw, "base64")
      const cipherBytes = Buffer.from(cipherRaw, "base64")
      const decipher = createDecipheriv("aes-256-gcm", this.encryptionKey, iv)
      decipher.setAuthTag(tag)
      const decrypted = Buffer.concat([decipher.update(cipherBytes), decipher.final()])
      return decrypted.toString("utf-8")
    } catch {
      return value
    }
  }
}
