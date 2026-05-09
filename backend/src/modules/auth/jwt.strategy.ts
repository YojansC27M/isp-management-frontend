import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { AuthService } from "./auth.service"
import type { AuthenticatedUserPayload } from "./auth.types"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.getOrThrow<string>("JWT_SECRET")
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: AuthenticatedUserPayload) {
    if (!payload.sub || !payload.email || !payload.jti) {
      throw new UnauthorizedException("Invalid token payload")
    }

    const revoked = await this.authService.isTokenRevoked(payload.jti, payload.sub, payload.iat)
    if (revoked) {
      throw new UnauthorizedException("Token revoked")
    }

    return {
      id: payload.sub,
      tokenJti: payload.jti,
      tokenIat: payload.iat,
      clientId: payload.clientId,
      email: payload.email,
      name: payload.name,
      roleKey: payload.roleKey,
      permissions: payload.permissions,
    }
  }
}
