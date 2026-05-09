import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CreateVisitDto, RescheduleVisitDto, UpdateVisitDto } from "./dto/visit.dto"
import { VisitsService } from "./visits.service"

@ApiTags("visits")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("visits")
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @RequirePermissions("visits.read")
  list() {
    return this.visitsService.list()
  }

  @Get(":id")
  @RequirePermissions("visits.read")
  getById(@Param("id") id: string) {
    return this.visitsService.getById(id)
  }

  @Post()
  @RequirePermissions("visits.write")
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: { id: string }) {
    return this.visitsService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("visits.write")
  update(@Param("id") id: string, @Body() dto: UpdateVisitDto, @CurrentUser() user: { id: string }) {
    return this.visitsService.update(id, dto, user.id)
  }

  @Post(":id/reschedule")
  @RequirePermissions("visits.write")
  reschedule(@Param("id") id: string, @Body() dto: RescheduleVisitDto, @CurrentUser() user: { id: string }) {
    return this.visitsService.reschedule(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("visits.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.visitsService.delete(id, user.id)
  }
}
