import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common"
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger"
import { CurrentUser } from "@/common/decorators/current-user.decorator"
import { RequirePermissions } from "@/common/decorators/permissions.decorator"
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard"
import { PermissionsGuard } from "@/common/guards/permissions.guard"
import { FilesInterceptor } from "@nestjs/platform-express"
import { memoryStorage } from "multer"
import { CreateTicketCommentDto, CreateTicketDto } from "./dto/ticket.dto"
import {
  ALLOWED_TICKET_ATTACHMENT_MIME_TYPES,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_ATTACHMENT_COUNT,
  type UploadedTicketAttachment,
} from "./ticket-attachment.constants"
import { TicketsService } from "./tickets.service"

@ApiTags("tickets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @RequirePermissions("tickets.read")
  list() {
    return this.ticketsService.list()
  }

  @Get(":id")
  @RequirePermissions("tickets.read")
  getById(@Param("id") id: string) {
    return this.ticketsService.getById(id)
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @RequirePermissions("tickets.write")
  @UseInterceptors(
    FilesInterceptor("attachment", MAX_TICKET_ATTACHMENT_COUNT, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_TICKET_ATTACHMENT_BYTES, files: MAX_TICKET_ATTACHMENT_COUNT },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_TICKET_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException("Unsupported ticket attachment type"), false)
          return
        }
        callback(null, true)
      },
    }),
  )
  create(@Body() dto: CreateTicketDto, @UploadedFiles() attachments: UploadedTicketAttachment[] | undefined, @CurrentUser() user: { id: string }) {
    return this.ticketsService.create(dto, user.id, attachments)
  }

  @Put(":id")
  @RequirePermissions("tickets.write")
  update(@Param("id") id: string, @Body() dto: CreateTicketDto, @CurrentUser() user: { id: string }) {
    return this.ticketsService.update(id, dto, user.id)
  }

  @Get(":id/comments")
  @RequirePermissions("tickets.read")
  listComments(@Param("id") id: string) {
    return this.ticketsService.listComments(id)
  }

  @Post(":id/comments")
  @RequirePermissions("tickets.write")
  addComment(@Param("id") id: string, @Body() dto: CreateTicketCommentDto, @CurrentUser() user: { id: string; name: string }) {
    return this.ticketsService.addComment(id, dto, user.name, user.id)
  }

  @Delete(":id")
  @RequirePermissions("tickets.write")
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.ticketsService.delete(id, user.id)
  }
}
