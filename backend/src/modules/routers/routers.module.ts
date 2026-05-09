import { Module } from "@nestjs/common"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { NetworkModule } from "../network/network.module"
import { RoutersController } from "./routers.controller"
import { RoutersService } from "./routers.service"

@Module({
  imports: [PrismaModule, NetworkModule],
  controllers: [RoutersController],
  providers: [RoutersService],
})
export class RoutersModule {}

