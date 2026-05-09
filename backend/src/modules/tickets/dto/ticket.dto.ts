import { IsIn, IsOptional, IsString, MinLength } from "class-validator"

const ticketStatuses = ["open", "in_progress", "waiting", "resolved", "closed"] as const
const ticketPriorities = ["low", "medium", "high"] as const
const ticketCategories = ["technical", "billing", "installation"] as const
const commentVisibilities = ["public", "internal"] as const

export class CreateTicketDto {
  @IsString()
  clientId!: string

  @IsOptional()
  @IsString()
  assignedUserId?: string

  @IsOptional()
  @IsString()
  assignedUserName?: string

  @IsOptional()
  @IsString()
  assignedTechnicianId?: string

  @IsOptional()
  @IsString()
  assignedTechnicianName?: string

  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(3)
  description!: string

  @IsIn(ticketStatuses)
  status!: (typeof ticketStatuses)[number]

  @IsIn(ticketPriorities)
  priority!: (typeof ticketPriorities)[number]

  @IsIn(ticketCategories)
  category!: (typeof ticketCategories)[number]
}

export class UpdateTicketDto extends CreateTicketDto {}

export class CreateTicketCommentDto {
  @IsString()
  @MinLength(1)
  message!: string

  @IsIn(commentVisibilities)
  visibility!: (typeof commentVisibilities)[number]
}
