import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"
import { MikrotikService } from "../network/mikrotik/mikrotik.service"

const DEFAULT_TRAFFIC_SAMPLING_INTERVAL_MS = 60_000
const MIN_TRAFFIC_SAMPLING_INTERVAL_MS = 10_000

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private samplerTimer: NodeJS.Timeout | null = null
  private samplingInProgress = false

  constructor(
    private readonly prisma: PrismaService,
    private readonly mikrotikService: MikrotikService,
  ) {}

  onModuleInit() {
    const parsed = Number(process.env["MONITORING_TRAFFIC_SAMPLING_MS"])
    const intervalMs = Number.isFinite(parsed)
      ? Math.max(MIN_TRAFFIC_SAMPLING_INTERVAL_MS, Math.trunc(parsed))
      : DEFAULT_TRAFFIC_SAMPLING_INTERVAL_MS

    this.samplerTimer = setInterval(() => {
      void this.sampleTrafficForAllRouters()
    }, intervalMs)
    this.samplerTimer.unref?.()

    void this.sampleTrafficForAllRouters()
  }

  onModuleDestroy() {
    if (this.samplerTimer) {
      clearInterval(this.samplerTimer)
      this.samplerTimer = null
    }
  }

  private async sampleTrafficForAllRouters() {
    if (this.samplingInProgress) return
    this.samplingInProgress = true

    try {
      const routers = await this.prisma.router.findMany({
        select: {
          id: true,
          ip: true,
          port: true,
          username: true,
          password: true,
        },
      })

      for (const router of routers) {
        await this.captureTrafficSample(router.id, router)
      }
    } finally {
      this.samplingInProgress = false
    }
  }

  private async captureTrafficSample(
    routerId: string,
    credentials: {
      ip: string
      port: number
      username: string
      password: string
    },
  ) {
    try {
      const interfaces = await this.mikrotikService.getInterfaces(routerId, {
        host: credentials.ip,
        port: credentials.port,
        username: credentials.username,
        password: credentials.password,
      })
      const totalRxMbps = interfaces.reduce((sum, item) => sum + item.rxMbps, 0)
      const totalTxMbps = interfaces.reduce((sum, item) => sum + item.txMbps, 0)
      const totalMbps = totalRxMbps + totalTxMbps
      const sampledMinute = new Date()
      sampledMinute.setSeconds(0, 0)

      await this.prisma.routerTrafficSample.upsert({
        where: {
          routerId_sampledMinute: {
            routerId,
            sampledMinute,
          },
        },
        create: {
          routerId,
          sampledMinute,
          rxMbps: totalRxMbps,
          txMbps: totalTxMbps,
          totalMbps,
        },
        update: {
          sampledAt: new Date(),
          rxMbps: totalRxMbps,
          txMbps: totalTxMbps,
          totalMbps,
        },
      })
    } catch {
      // Best-effort sampler: errors are intentionally ignored to avoid crashing module lifecycle.
    }
  }

  async listRouters() {
    const routers = await this.prisma.router.findMany({
      orderBy: [{ createdAt: "desc" }],
    })

    return routers.map((router) => ({
      id: router.id,
      name: router.name,
      ip: router.ip,
      zone: router.zone,
      location: router.location,
      status: router.status,
    }))
  }

  private async findRouterOrThrow(routerId: string) {
    const router = await this.prisma.router.findUnique({ where: { id: routerId } })
    if (!router) {
      throw new NotFoundException("Router not found")
    }
    return router
  }

  async getRouterMetrics(routerId: string) {
    const router = await this.findRouterOrThrow(routerId)

    try {
      const [health, interfaces] = await Promise.all([
        this.mikrotikService.getHealth(routerId, {
          host: router.ip,
          port: router.port,
          username: router.username,
          password: router.password,
        }),
        this.mikrotikService.getInterfaces(routerId, {
          host: router.ip,
          port: router.port,
          username: router.username,
          password: router.password,
        }),
      ])
      const totalRxMbps = interfaces.reduce((sum, item) => sum + item.rxMbps, 0)
      const totalTxMbps = interfaces.reduce((sum, item) => sum + item.txMbps, 0)
      const totalMbps = totalRxMbps + totalTxMbps
      await this.captureTrafficSample(routerId, {
        ip: router.ip,
        port: router.port,
        username: router.username,
        password: router.password,
      })

      await this.prisma.router.update({
        where: { id: routerId },
        data: {
          status: "online",
          lastCheckedAt: new Date(),
        },
      })

      return {
        cpuUsage: health.cpu,
        ramUsage: health.ram,
        uptime: `${Math.floor(health.uptimeSeconds / 86_400)}d ${Math.floor((health.uptimeSeconds % 86_400) / 3600)}h`,
        totalTraffic: `${totalMbps.toFixed(2)} Mbps`,
        rxTraffic: `${totalRxMbps.toFixed(2)} Mbps`,
        txTraffic: `${totalTxMbps.toFixed(2)} Mbps`,
        degraded: false,
      }
    } catch {
      await this.prisma.router.update({
        where: { id: routerId },
        data: {
          status: "offline",
          lastCheckedAt: new Date(),
        },
      })

      return {
        cpuUsage: 0,
        ramUsage: 0,
        uptime: "0d 0h",
        totalTraffic: "0 Mbps",
        rxTraffic: "0 Mbps",
        txTraffic: "0 Mbps",
        degraded: true,
      }
    }
  }

  async getRouterInterfaces(routerId: string) {
    const router = await this.findRouterOrThrow(routerId)

    try {
      const interfaces = await this.mikrotikService.getInterfaces(routerId, {
        host: router.ip,
        port: router.port,
        username: router.username,
        password: router.password,
      })

      return interfaces.map((item) => ({
        name: item.name,
        status: item.status,
        rx: `${item.rxMbps.toFixed(2)} Mbps`,
        tx: `${item.txMbps.toFixed(2)} Mbps`,
        rxMbps: item.rxMbps,
        txMbps: item.txMbps,
      }))
    } catch {
      return [
        {
          name: "connection-unavailable",
          status: "down" as const,
          rx: "0 Mbps",
          tx: "0 Mbps",
          rxMbps: 0,
          txMbps: 0,
        },
      ]
    }
  }
}
