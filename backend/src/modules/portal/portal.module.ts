import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { PortalController } from "./portal.controller"
import { PortalService } from "./portal.service"

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
