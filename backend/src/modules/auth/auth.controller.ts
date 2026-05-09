import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import type { Request } from "express"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { LoginDto } from "./dto/login.dto"
import { AuthService } from "./auth.service"

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto.email, dto.password, {
      ip: request.ip,
      userAgent: request.header("user-agent"),
    })
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("refresh-me")
  refreshMe(@CurrentUser() user: { id: string }) {
    return this.authService.refreshMe(user.id)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@CurrentUser() user: { id: string; tokenJti: string }, @Req() request: Request) {
    return this.authService.logout(user.id, user.tokenJti, {
      ip: request.ip,
      userAgent: request.header("user-agent"),
    })
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  logoutAll(@CurrentUser() user: { id: string; tokenIat?: number }, @Req() request: Request) {
    return this.authService.logoutAll(user.id, user.tokenIat, {
      ip: request.ip,
      userAgent: request.header("user-agent"),
    })
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("navigation")
  navigation(@CurrentUser() user: { permissions: string[] }) {
    return this.authService.navigationForPermissions(user.permissions ?? [])
  }
}
