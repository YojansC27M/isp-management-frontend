import { Transform, Type } from "class-transformer"
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator"

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/

export class UpdateSystemSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  companyName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  tradeName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  taxId!: string

  @IsEmail()
  billingEmail!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  billingPhone!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  timezone!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  invoicePrefix!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  logoUrl!: string

  @IsString()
  @Matches(hexColorRegex)
  brandPrimaryColor!: string

  @IsString()
  @Matches(hexColorRegex)
  brandSecondaryColor!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  legalFooter!: string
}

export class UploadSystemLogoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  fileName!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(3_000_000)
  dataUrl!: string
}

const documentTypeCodeRegex = /^[A-Z0-9_]{2,20}$/

export class ListDocumentTypesQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  includeInactive?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string

  @IsOptional()
  @IsString()
  @IsIn(["all", "active", "inactive"])
  status?: "all" | "active" | "inactive"

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number
}

export class CreateDocumentTypeDto {
  @IsString()
  @Matches(documentTypeCodeRegex)
  code!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string
}

export class UpdateDocumentTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}
