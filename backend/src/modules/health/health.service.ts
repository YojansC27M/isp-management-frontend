import { Injectable } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      status: "ok",
      service: "isp-management-api",
      uptimeSeconds: Math.floor(process.uptime()),
    }
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: "ready",
        service: "isp-management-api",
        uptimeSeconds: Math.floor(process.uptime()),
        checks: [{ name: "database", status: "ok" }],
      }
    } catch {
      return {
        status: "not_ready",
        service: "isp-management-api",
        uptimeSeconds: Math.floor(process.uptime()),
        checks: [{ name: "database", status: "error" }],
      }
    }
  }
}
