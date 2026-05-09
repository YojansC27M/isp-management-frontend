import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import type { Response } from "express"
import { Res } from "@nestjs/common"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { CreateRouterDto, ListRoutersQueryDto, TestRouterConnectionDto, UpdateRouterDto } from "./dto/router.dto"
import { RoutersService } from "./routers.service"

@ApiTags("routers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("routers")
export class RoutersController {
  constructor(private readonly routersService: RoutersService) {}

  @Get()
  @RequirePermissions("routers.read")
  list(@Query() query: ListRoutersQueryDto) {
    return this.routersService.list(query)
  }

  @Get(":id")
  @RequirePermissions("routers.read")
  getById(@Param("id") id: string) {
    return this.routersService.getById(id)
  }

  @Post()
  @RequirePermissions("routers.write")
  create(@Body() dto: CreateRouterDto, @CurrentUser() user: { id: string }) {
    return this.routersService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("routers.write")
  update(@Param("id") id: string, @Body() dto: UpdateRouterDto, @CurrentUser() user: { id: string }) {
    return this.routersService.update(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("routers.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.routersService.remove(id, user.id)
  }

  @Post("test-connection")
  @RequirePermissions("routers.write")
  testConnection(@Body() dto: TestRouterConnectionDto, @CurrentUser() user: { id: string }) {
    return this.routersService.testConnection(dto, user.id)
  }

  @Post(":id/test-connection")
  @RequirePermissions("routers.write")
  testConnectionById(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.routersService.testConnectionById(id, user.id)
  }

  @Get(":id/health")
  @RequirePermissions("monitoring.read")
  getHealth(@Param("id") id: string) {
    return this.routersService.getHealth(id)
  }

  @Get(":id/backups")
  @RequirePermissions("routers.read")
  listBackups(@Param("id") id: string) {
    return this.routersService.listBackups(id)
  }

  @Post(":id/backups")
  @RequirePermissions("routers.write")
  createBackup(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.routersService.createBackup(id, user.id)
  }

  @Get(":id/backups/:backupId/download")
  @RequirePermissions("routers.read")
  async downloadBackup(
    @Param("id") id: string,
    @Param("backupId") backupId: string,
    @CurrentUser() user: { id: string },
    @Res() response: Response,
  ) {
    const file = await this.routersService.downloadBackup(id, backupId, user.id)
    response.setHeader("Content-Type", "application/octet-stream")
    response.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`)
    response.send(file.buffer)
  }
}
