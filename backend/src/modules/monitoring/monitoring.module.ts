import { Module } from "@nestjs/common"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { NetworkModule } from "../network/network.module"
import { MonitoringController } from "./monitoring.controller"
import { MonitoringService } from "./monitoring.service"

@Module({
  imports: [PrismaModule, NetworkModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
