import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { ListClientsMapQueryDto } from "./dto/list-clients-map.query.dto"
import { ClientsMapService } from "./clients-map.service"

@ApiTags("clients-map")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("clients-map")
export class ClientsMapController {
  constructor(private readonly clientsMapService: ClientsMapService) {}

  @Get()
  @RequirePermissions("clients_map.read")
  list(@Query() query: ListClientsMapQueryDto) {
    return this.clientsMapService.list(query)
  }
}
