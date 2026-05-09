import { Controller, Get, Param, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { MonitoringService } from "./monitoring.service"

@ApiTags("monitoring")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("monitoring")
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get("routers")
  @RequirePermissions("monitoring.read")
  listRouters() {
    return this.monitoringService.listRouters()
  }

  @Get("routers/:routerId/metrics")
  @RequirePermissions("monitoring.read")
  getRouterMetrics(@Param("routerId") routerId: string) {
    return this.monitoringService.getRouterMetrics(routerId)
  }

  @Get("routers/:routerId/interfaces")
  @RequirePermissions("monitoring.read")
  getRouterInterfaces(@Param("routerId") routerId: string) {
    return this.monitoringService.getRouterInterfaces(routerId)
  }
}
