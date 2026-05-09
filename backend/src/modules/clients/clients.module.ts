import { Module } from "@nestjs/common"
import { PrismaModule } from "@/common/prisma/prisma.module"
import { TicketsModule } from "../tickets/tickets.module"
import { VisitsModule } from "../visits/visits.module"
import { ClientsController } from "./clients.controller"
import { ClientsService } from "./clients.service"

@Module({
  imports: [PrismaModule, TicketsModule, VisitsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
