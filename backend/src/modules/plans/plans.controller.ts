import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CreatePlanDto, ListPlansQueryDto, UpdatePlanDto } from "./dto/plan.dto"
import { PlansService } from "./plans.service"

@ApiTags("plans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @RequirePermissions("plans.read")
  list(@Query() query: ListPlansQueryDto) {
    return this.plansService.list(query)
  }

  @Get("page")
  @RequirePermissions("plans.read")
  listPage(@Query() query: ListPlansQueryDto) {
    return this.plansService.listPage(query)
  }

  @Get(":id")
  @RequirePermissions("plans.read")
  getById(@Param("id") id: string) {
    return this.plansService.getById(id)
  }

  @Post()
  @RequirePermissions("plans.write")
  create(@Body() dto: CreatePlanDto, @CurrentUser() user: { id: string }) {
    return this.plansService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("plans.write")
  update(@Param("id") id: string, @Body() dto: UpdatePlanDto, @CurrentUser() user: { id: string }) {
    return this.plansService.update(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("plans.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.plansService.delete(id, user.id)
  }
}
