import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { SupportOverviewQueryDto } from "./dto/support-overview.query.dto"
import { SupportService } from "./support.service"

@ApiTags("support")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("support")
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get("overview")
  @RequirePermissions("tickets.read")
  getOverview(@Query() query: SupportOverviewQueryDto, @CurrentUser() user: { id: string }) {
    return this.supportService.getOverview(query.days ?? 7, user.id)
  }
}

