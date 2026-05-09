import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateTicketCommentDto, CreateTicketDto } from "./dto/ticket.dto"
import {
  getTicketAttachmentExtension,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_ATTACHMENT_COUNT,
  sanitizeOriginalAttachmentName,
  type UploadedTicketAttachment,
  TICKET_ATTACHMENT_UPLOAD_DIR,
} from "./ticket-attachment.constants"
import { getPrimaryTicketAttachment, getTicketAttachments } from "./ticket-attachment.mapper"

const ticketInclude = {
  client: true,
  comments: {
    orderBy: { createdAt: "asc" },
  },
  attachments: {
    orderBy: { createdAt: "asc" },
  },
} as const

const toDateTime = (value: Date) => value.toISOString()
const INTERNAL_USER_PROFILE_KEY_PREFIX = "internal_user_profile::"
const ticketTransitions: Record<string, string[]> = {
  open: ["in_progress", "waiting", "closed"],
  in_progress: ["waiting", "resolved", "closed"],
  waiting: ["in_progress", "resolved", "closed"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"],
}

const toTicketShape = (ticket: Prisma.TicketGetPayload<{ include: typeof ticketInclude }>) => {
  const history = [
    {
      id: `${ticket.id}-created`,
      ticketId: ticket.id,
      message: "Ticket creado",
      createdAt: toDateTime(ticket.createdAt),
    },
    ...ticket.comments.map((comment) => ({
      id: comment.id,
      ticketId: ticket.id,
      message: `${comment.visibility === "internal" ? "Nota interna" : "Comentario"}: ${comment.message}`,
      createdAt: toDateTime(comment.createdAt),
    })),
  ]

  const attachments = getTicketAttachments(ticket)

  return {
    id: ticket.id,
    clientId: ticket.clientId,
    assignedUserId: ticket.assignedUserId,
    assignedUserName: ticket.assignedUserName,
    clientName: ticket.client.name,
    clientPhone: ticket.client.phone ?? "",
    assignedTechnicianId: ticket.assignedTechnicianId,
    assignedTechnicianName: ticket.assignedTechnicianName,
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    attachment: getPrimaryTicketAttachment(ticket),
    attachments,
    createdAt: toDateTime(ticket.createdAt),
    history,
  }
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  private getTicketAttachmentFilePath(fileName: string) {
    return join(process.cwd(), TICKET_ATTACHMENT_UPLOAD_DIR, fileName)
  }

  private async storeAttachment(file?: UploadedTicketAttachment | null) {
    if (!file) return null
    if (file.size > MAX_TICKET_ATTACHMENT_BYTES) {
      throw new BadRequestException("Attachment exceeds the allowed size")
    }

    const extension = getTicketAttachmentExtension(file.mimetype)
    const fileName = `${randomUUID()}${extension}`
    const filePath = this.getTicketAttachmentFilePath(fileName)
    const originalName = sanitizeOriginalAttachmentName(file.originalname)

    await mkdir(join(process.cwd(), TICKET_ATTACHMENT_UPLOAD_DIR), { recursive: true })
    await writeFile(filePath, file.buffer)

    return {
      fileName,
      originalName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    }
  }

  private async storeAttachments(files?: UploadedTicketAttachment[] | null) {
    if (!files?.length) return []
    if (files.length > MAX_TICKET_ATTACHMENT_COUNT) {
      throw new BadRequestException(`You can attach up to ${MAX_TICKET_ATTACHMENT_COUNT} files per ticket`)
    }

    const storedAttachments: Array<{
      fileName: string
      originalName: string
      mimeType: string
      sizeBytes: number
    }> = []

    try {
      for (const file of files) {
        const stored = await this.storeAttachment(file)
        if (stored) {
          storedAttachments.push(stored)
        }
      }
      return storedAttachments
    } catch (error) {
      await Promise.all(storedAttachments.map((attachment) => this.removeAttachment(attachment.fileName)))
      throw error
    }
  }

  private async removeAttachment(fileName?: string | null) {
    if (!fileName) return

    try {
      await unlink(this.getTicketAttachmentFilePath(fileName))
    } catch {
      // Best effort cleanup only.
    }
  }

  private profileKey(userId: string) {
    return `${INTERNAL_USER_PROFILE_KEY_PREFIX}${userId}`
  }

  private parseInternalUserStatus(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "active"
    const rawStatus = (value as Record<string, unknown>)["status"]
    return rawStatus === "inactive" ? "inactive" : "active"
  }

  private async resolveAssignableSupportUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!user || !user.role || !["admin", "staff", "support"].includes(user.role.key)) {
      throw new BadRequestException("Assigned internal user is not valid for ticket assignment")
    }

    const profile = await this.prisma.systemSetting.findUnique({
      where: { key: this.profileKey(user.id) },
    })
    if (this.parseInternalUserStatus(profile?.value) !== "active") {
      throw new BadRequestException("Assigned internal user is inactive")
    }

    return user
  }

  private async resolveAssignableTechnician(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!user || user.role?.key !== "technician") {
      throw new BadRequestException("Assigned technician is not valid")
    }

    const profile = await this.prisma.systemSetting.findUnique({
      where: { key: this.profileKey(user.id) },
    })
    if (this.parseInternalUserStatus(profile?.value) !== "active") {
      throw new BadRequestException("Assigned technician is inactive")
    }

    return user
  }

  private ensureAllowedStatusTransition(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) return

    const allowed = ticketTransitions[currentStatus]
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException(`Invalid ticket status transition: ${currentStatus} -> ${nextStatus}`)
    }
  }

  private async resolveAssignees(dto: CreateTicketDto) {
    const assignedUserId = dto.assignedUserId?.trim() ?? ""
    const assignedTechnicianId = dto.assignedTechnicianId?.trim() ?? ""
    const category = dto.category

    let assignedUserName = ""
    let assignedTechnicianName = ""

    if (assignedUserId) {
      const user = await this.resolveAssignableSupportUser(assignedUserId)
      assignedUserName = user.name
    }

    if (category === "billing" && assignedTechnicianId) {
      throw new BadRequestException("Billing tickets cannot have technicians assigned")
    }

    if (assignedTechnicianId) {
      const technician = await this.resolveAssignableTechnician(assignedTechnicianId)
      assignedTechnicianName = technician.name
    }

    return {
      assignedUserId,
      assignedUserName,
      assignedTechnicianId: category === "billing" ? "" : assignedTechnicianId,
      assignedTechnicianName: category === "billing" ? "" : assignedTechnicianName,
    }
  }

  async list() {
    const tickets = await this.prisma.ticket.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: ticketInclude,
    })

    return tickets.map(toTicketShape)
  }

  async listByClient(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    })

    if (!client) {
      throw new NotFoundException("Client not found")
    }

    const tickets = await this.prisma.ticket.findMany({
      where: { clientId },
      orderBy: [{ createdAt: "desc" }],
      include: ticketInclude,
    })

    return tickets.map(toTicketShape)
  }

  async getById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    })

    if (!ticket) {
      throw new NotFoundException("Ticket not found")
    }

    return toTicketShape(ticket)
  }

  async create(dto: CreateTicketDto, actorId?: string, attachments?: UploadedTicketAttachment[] | null) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } })
    if (!client) {
      throw new NotFoundException("Client not found")
    }

    const assignees = await this.resolveAssignees(dto)
    const storedAttachments = await this.storeAttachments(attachments)

    try {
      const ticket = await this.prisma.$transaction(async (prisma) => {
        const createdTicket = await prisma.ticket.create({
          data: {
            clientId: dto.clientId,
            assignedUserId: assignees.assignedUserId,
            assignedUserName: assignees.assignedUserName,
            assignedTechnicianId: assignees.assignedTechnicianId,
            assignedTechnicianName: assignees.assignedTechnicianName,
            title: dto.title.trim(),
            description: dto.description.trim(),
            status: dto.status,
            priority: dto.priority,
            category: dto.category,
            attachmentFileName: storedAttachments[0]?.fileName ?? null,
            attachmentOriginalName: storedAttachments[0]?.originalName ?? null,
            attachmentMimeType: storedAttachments[0]?.mimeType ?? null,
            attachmentSizeBytes: storedAttachments[0]?.sizeBytes ?? null,
          },
        })

        if (storedAttachments.length > 0) {
          await prisma.ticketAttachment.createMany({
            data: storedAttachments.map((attachment) => ({
              ticketId: createdTicket.id,
              fileName: attachment.fileName,
              originalName: attachment.originalName,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
            })),
          })
        }

        return prisma.ticket.findUniqueOrThrow({
          where: { id: createdTicket.id },
          include: ticketInclude,
        })
      })

      await this.prisma.auditLog.create({
        data: {
          userId: actorId,
          action: "tickets.create",
          entity: "ticket",
          entityId: ticket.id,
          metadata: {
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            hasAttachment: storedAttachments.length > 0,
            attachmentCount: storedAttachments.length,
          },
        },
      })

      return toTicketShape(ticket)
    } catch (error) {
      await Promise.all(storedAttachments.map((attachment) => this.removeAttachment(attachment.fileName)))
      throw error
    }
  }

  async update(id: string, dto: CreateTicketDto, actorId?: string) {
    const existing = await this.prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!existing) {
      throw new NotFoundException("Ticket not found")
    }

    this.ensureAllowedStatusTransition(existing.status, dto.status)

    const assignees = await this.resolveAssignees(dto)

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        assignedUserId: assignees.assignedUserId,
        assignedUserName: assignees.assignedUserName,
        assignedTechnicianId: assignees.assignedTechnicianId,
        assignedTechnicianName: assignees.assignedTechnicianName,
        title: dto.title.trim(),
        description: dto.description.trim(),
        status: dto.status,
        priority: dto.priority,
        category: dto.category,
      },
      include: ticketInclude,
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "tickets.update",
        entity: "ticket",
        entityId: ticket.id,
        metadata: {
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
        },
      },
    })

    return toTicketShape(ticket)
  }

  async listComments(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw new NotFoundException("Ticket not found")
    }

    const comments = await this.prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    })

    return comments.map((comment) => ({
      id: comment.id,
      ticketId: comment.ticketId,
      message: comment.message,
      createdAt: toDateTime(comment.createdAt),
      author: comment.author,
      visibility: comment.visibility,
    }))
  }

  async addComment(ticketId: string, dto: CreateTicketCommentDto, author: string, actorId?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      throw new NotFoundException("Ticket not found")
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        message: dto.message.trim(),
        visibility: dto.visibility,
        author,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "tickets.add_comment",
        entity: "ticket_comment",
        entityId: comment.id,
        metadata: {
          ticketId,
          visibility: comment.visibility,
        },
      },
    })

    return {
      id: comment.id,
      ticketId: comment.ticketId,
      message: comment.message,
      createdAt: toDateTime(comment.createdAt),
      author: comment.author,
      visibility: comment.visibility,
    }
  }

  async delete(id: string, actorId?: string) {
    await this.getById(id)
    await this.prisma.ticket.delete({
      where: { id },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: "tickets.delete",
        entity: "ticket",
        entityId: id,
      },
    })

    return { ok: true }
  }
}
