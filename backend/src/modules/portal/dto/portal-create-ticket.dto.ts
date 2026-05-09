import { IsIn, IsString, MaxLength, MinLength } from "class-validator"

const ticketPriorities = ["low", "medium", "high"] as const
const ticketCategories = ["technical", "billing", "installation"] as const

export class PortalCreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title!: string

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string

  @IsIn(ticketPriorities)
  priority!: (typeof ticketPriorities)[number]

  @IsIn(ticketCategories)
  category!: (typeof ticketCategories)[number]
}
