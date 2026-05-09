import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { TicketsService } from "../tickets/tickets.service"
import { VisitsService } from "../visits/visits.service"
import { ClientsService } from "./clients.service"
import { CreateClientDto, ListClientsQueryDto, SearchClientsQueryDto, UpdateClientDto } from "./dto/client.dto"

@ApiTags("clients")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("clients")
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly ticketsService: TicketsService,
    private readonly visitsService: VisitsService,
  ) {}

  @Get()
  @RequirePermissions("clients.read")
  list(@Query() query: ListClientsQueryDto) {
    return this.clientsService.list(query)
  }

  @Get("search")
  @RequirePermissions("clients.read")
  search(@Query() query: SearchClientsQueryDto) {
    return this.clientsService.search(query.q ?? "", query.limit ?? 20)
  }

  @Get(":id")
  @RequirePermissions("clients.read")
  getById(@Param("id") id: string) {
    return this.clientsService.getById(id)
  }

  @Get(":id/tickets")
  @RequirePermissions("tickets.read")
  listTickets(@Param("id") id: string) {
    return this.ticketsService.listByClient(id)
  }

  @Get(":id/visits")
  @RequirePermissions("visits.read")
  listVisits(@Param("id") id: string) {
    return this.visitsService.listByClient(id)
  }

  @Post()
  @RequirePermissions("clients.write")
  create(@Body() dto: CreateClientDto, @CurrentUser() user: { id: string }) {
    return this.clientsService.create(dto, user.id)
  }

  @Put(":id")
  @RequirePermissions("clients.write")
  update(@Param("id") id: string, @Body() dto: UpdateClientDto, @CurrentUser() user: { id: string }) {
    return this.clientsService.update(id, dto, user.id)
  }

  @Delete(":id")
  @RequirePermissions("clients.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.clientsService.delete(id, user.id)
  }
}
