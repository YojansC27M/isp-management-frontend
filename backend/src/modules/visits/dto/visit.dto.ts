import { IsDateString, IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator"

const visitTypes = ["installation", "maintenance", "support"] as const
const visitStatuses = ["scheduled", "in_progress", "completed", "canceled"] as const
const hhmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export class CreateVisitDto {
  @IsString()
  clientId!: string

  @IsOptional()
  @IsString()
  technicianId?: string

  @IsOptional()
  @IsString()
  technicianName?: string

  @IsString()
  @MinLength(1)
  zone!: string

  @IsIn(visitTypes)
  type!: (typeof visitTypes)[number]

  @IsDateString()
  scheduledDate!: string

  @IsString()
  @Matches(hhmmRegex)
  scheduledTime!: string

  @IsIn(visitStatuses)
  status!: (typeof visitStatuses)[number]

  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateVisitDto extends CreateVisitDto {}

export class RescheduleVisitDto {
  @IsDateString()
  scheduledDate!: string

  @IsString()
  @Matches(hhmmRegex)
  scheduledTime!: string

  @IsOptional()
  @IsString()
  notes?: string
}
