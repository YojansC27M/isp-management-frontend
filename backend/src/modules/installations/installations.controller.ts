import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CreateInstallationDto, ListInstallationsQueryDto, UpdateInstallationDto } from "./dto/installation.dto"
import { InstallationsService } from "./installations.service"

@ApiTags("installations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("installations")
export class InstallationsController {
  constructor(private readonly installationsService: InstallationsService) {}

  @Get()
  @RequirePermissions("visits.read")
  list(@Query() query: ListInstallationsQueryDto) {
    return this.installationsService.list(query)
  }

  @Get("client/:clientId")
  @RequirePermissions("clients.read")
  getByClient(@Param("clientId") clientId: string) {
    return this.installationsService.getByClient(clientId)
  }

  @Get("client/:clientId/movements")
  @RequirePermissions("clients.read")
  getMovementsByClient(@Param("clientId") clientId: string) {
    return this.installationsService.getMovementsByClient(clientId)
  }

  @Get("router/:routerId")
  @RequirePermissions("routers.read")
  getByRouter(@Param("routerId") routerId: string) {
    return this.installationsService.getByRouter(routerId)
  }

  @Get(":id")
  @RequirePermissions("visits.read")
  getById(@Param("id") id: string) {
    return this.installationsService.getById(id)
  }

  @Post()
  @RequirePermissions("visits.write")
  create(@Body() dto: CreateInstallationDto, @CurrentUser() user: { id: string }) {
    return this.installationsService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("visits.write")
  update(@Param("id") id: string, @Body() dto: UpdateInstallationDto, @CurrentUser() user: { id: string }) {
    return this.installationsService.update(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("visits.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.installationsService.delete(id, user.id)
  }
}
