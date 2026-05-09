import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import type { Response } from "express"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { SecurityAuditExportQueryDto, SecurityAuditQueryDto } from "./dto/audit-query.dto"
import { UpdateRolePermissionsDto, UpdateUserPermissionOverridesDto } from "./dto/role-permissions.dto"
import { SecurityService } from "./security.service"

@ApiTags("security")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get("permissions")
  @RequirePermissions("roles.read")
  getPermissions() {
    return this.securityService.getPermissions()
  }

  @Get("roles")
  @RequirePermissions("roles.read")
  getRoles() {
    return this.securityService.getRoles()
  }

  @Get("roles/:roleId/permissions")
  @RequirePermissions("roles.read")
  getRolePermissions(@Param("roleId") roleId: string) {
    return this.securityService.getRolePermissions(roleId)
  }

  @Put("roles/:roleId/permissions")
  @RequirePermissions("roles.write")
  updateRolePermissions(
    @Param("roleId") roleId: string,
    @Body() body: UpdateRolePermissionsDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.securityService.updateRolePermissions(roleId, body.permissions ?? [], user.id)
  }

  @Post("roles/:roleId/permissions/reset")
  @RequirePermissions("roles.write")
  resetRolePermissions(@Param("roleId") roleId: string, @CurrentUser() user: { id: string }) {
    return this.securityService.resetRolePermissions(roleId, user.id)
  }

  @Post("roles/permissions/reset-all")
  @RequirePermissions("roles.write")
  resetAllPermissions(@CurrentUser() user: { id: string }) {
    return this.securityService.resetAllPermissions(user.id)
  }

  @Get("users/:userId/permissions")
  @RequirePermissions("roles.read")
  getUserPermissionOverrides(@Param("userId") userId: string) {
    return this.securityService.getUserPermissionOverrides(userId)
  }

  @Put("users/:userId/permissions")
  @RequirePermissions("roles.write")
  updateUserPermissionOverrides(
    @Param("userId") userId: string,
    @Body() body: UpdateUserPermissionOverridesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.securityService.updateUserPermissionOverrides(userId, body.grants ?? [], body.revokes ?? [], user.id)
  }

  @Get("roles/permissions/audit/export")
  @RequirePermissions("audit.read")
  async exportAudit(@Query() query: SecurityAuditExportQueryDto, @Res() response: Response) {
    const format = query.format ?? "csv"
    const exported = await this.securityService.exportAudit(query, format)
    response.setHeader("Content-Type", exported.contentType)
    response.setHeader("Content-Disposition", `attachment; filename="${exported.fileName}"`)
    response.send(exported.buffer)
  }

  @Get("roles/permissions/audit")
  @RequirePermissions("audit.read")
  getAudit(@Query() query: SecurityAuditQueryDto) {
    return this.securityService.getAudit(query)
  }

  @Get("roles/permissions/audit/page")
  @RequirePermissions("audit.read")
  getAuditPage(@Query() query: SecurityAuditQueryDto) {
    return this.securityService.getAuditPage(query)
  }
}
