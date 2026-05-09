import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { HealthService } from "./health.service"

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getLiveness()
  }

  @Get("live")
  getLiveness() {
    return this.healthService.getLiveness()
  }

  @Get("ready")
  async getReadiness() {
    const readiness = await this.healthService.getReadiness()
    if (readiness.status !== "ready") {
      throw new ServiceUnavailableException({
        message: "Service is not ready",
        code: "SERVICE_NOT_READY",
        details: readiness.checks,
      })
    }
    return readiness
  }
}
