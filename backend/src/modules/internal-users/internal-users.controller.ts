import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CreateInternalUserDto, ListInternalUsersQueryDto, UpdateInternalUserDto } from "./dto/internal-user.dto"
import { InternalUsersService } from "./internal-users.service"

@ApiTags("internal-users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("internal-users")
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Get()
  @RequirePermissions("internal_users.read")
  list(@Query() query: ListInternalUsersQueryDto) {
    return this.internalUsersService.list(query)
  }

  @Get(":id")
  @RequirePermissions("internal_users.read")
  getById(@Param("id") id: string) {
    return this.internalUsersService.getById(id)
  }

  @Post()
  @RequirePermissions("internal_users.write")
  create(@Body() dto: CreateInternalUserDto, @CurrentUser() user: { id: string }) {
    return this.internalUsersService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("internal_users.write")
  update(@Param("id") id: string, @Body() dto: UpdateInternalUserDto, @CurrentUser() user: { id: string }) {
    return this.internalUsersService.update(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("internal_users.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.internalUsersService.delete(id, user.id)
  }
}
