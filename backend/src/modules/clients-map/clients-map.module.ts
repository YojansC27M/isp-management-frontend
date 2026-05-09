import { Module } from "@nestjs/common"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { ClientsMapController } from "./clients-map.controller"
import { ClientsMapService } from "./clients-map.service"

@Module({
  imports: [PrismaModule],
  controllers: [ClientsMapController],
  providers: [ClientsMapService],
})
export class ClientsMapModule {}
