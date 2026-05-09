import { IsDateString, IsOptional } from "class-validator"

export class RunBillingAutomationDto {
  @IsOptional()
  @IsDateString()
  at?: string
}

