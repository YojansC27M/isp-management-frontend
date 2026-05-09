import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import {
  CreateDocumentTypeDto,
  ListDocumentTypesQueryDto,
  UpdateDocumentTypeDto,
  UploadSystemLogoDto,
  UpdateSystemSettingsDto,
} from "./dto/system-settings.dto"
import { SettingsService } from "./settings.service"

@ApiTags("settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("settings/system")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions("system_settings.read")
  getSystemSettings() {
    return this.settingsService.getSystemSettings()
  }

  @Put()
  @RequirePermissions("system_settings.write")
  updateSystemSettings(@Body() payload: UpdateSystemSettingsDto, @CurrentUser() user: { id: string }) {
    return this.settingsService.updateSystemSettings(payload, user.id)
  }

  @Post("logo")
  @RequirePermissions("system_settings.write")
  uploadLogo(@Body() payload: UploadSystemLogoDto, @CurrentUser() user: { id: string }) {
    return this.settingsService.uploadSystemLogo(payload, user.id)
  }

  @Get("document-types")
  @RequirePermissions("system_settings.read")
  listDocumentTypes(@Query() query: ListDocumentTypesQueryDto) {
    return this.settingsService.listDocumentTypes(query)
  }

  @Post("document-types")
  @RequirePermissions("system_settings.write")
  createDocumentType(@Body() payload: CreateDocumentTypeDto, @CurrentUser() user: { id: string }) {
    return this.settingsService.createDocumentType(payload, user.id)
  }

  @Put("document-types/:id")
  @RequirePermissions("system_settings.write")
  updateDocumentType(@Param("id") id: string, @Body() payload: UpdateDocumentTypeDto, @CurrentUser() user: { id: string }) {
    return this.settingsService.updateDocumentType(id, payload, user.id)
  }

  @Delete("document-types/:id")
  @RequirePermissions("system_settings.write")
  deactivateDocumentType(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.settingsService.deactivateDocumentType(id, user.id)
  }
}
