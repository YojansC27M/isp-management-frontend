import { BadRequestException } from "@nestjs/common"

export const MAX_TICKET_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const MAX_TICKET_ATTACHMENT_COUNT = 5
export const TICKET_ATTACHMENT_UPLOAD_DIR = "uploads/tickets"

export type UploadedTicketAttachment = {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "application/x-rar-compressed": ".rar",
}

export const ALLOWED_TICKET_ATTACHMENT_MIME_TYPES = new Set(Object.keys(MIME_TYPE_TO_EXTENSION))

export const TICKET_ATTACHMENT_ACCEPT = [
  "image/*",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
].join(",")

export const getTicketAttachmentExtension = (mimeType: string) => {
  const extension = MIME_TYPE_TO_EXTENSION[mimeType]
  if (!extension) {
    throw new BadRequestException("Unsupported ticket attachment type")
  }
  return extension
}

export const sanitizeOriginalAttachmentName = (value: string) => {
  const cleaned = value
    .trim()
    .replace(/[\u0000-\u001f\u007f]+/g, "")
    .replace(/[\\/]+/g, " ")
    .replace(/\s+/g, " ")
  return cleaned.length > 120 ? cleaned.slice(0, 120) : cleaned
}
