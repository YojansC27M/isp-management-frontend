export interface TicketAttachmentShape {
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
  url: string
}

type TicketAttachmentRecord = {
  fileName: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

type LegacyTicketAttachmentRecord = {
  attachmentFileName?: string | null
  attachmentOriginalName?: string | null
  attachmentMimeType?: string | null
  attachmentSizeBytes?: number | null
}

type TicketWithAttachments = LegacyTicketAttachmentRecord & {
  attachments?: TicketAttachmentRecord[]
}

const TICKET_ATTACHMENT_URL_PREFIX = "/uploads/tickets/"

const toAttachmentShape = (attachment: TicketAttachmentRecord): TicketAttachmentShape => ({
  fileName: attachment.fileName,
  originalName: attachment.originalName,
  mimeType: attachment.mimeType,
  sizeBytes: attachment.sizeBytes,
  url: `${TICKET_ATTACHMENT_URL_PREFIX}${encodeURIComponent(attachment.fileName)}`,
})

export const getTicketAttachments = (ticket: TicketWithAttachments): TicketAttachmentShape[] => {
  if (ticket.attachments && ticket.attachments.length > 0) {
    return ticket.attachments.map(toAttachmentShape)
  }

  if (!ticket.attachmentFileName) {
    return []
  }

  return [
    {
      fileName: ticket.attachmentFileName,
      originalName: ticket.attachmentOriginalName ?? ticket.attachmentFileName,
      mimeType: ticket.attachmentMimeType ?? "application/octet-stream",
      sizeBytes: ticket.attachmentSizeBytes ?? 0,
      url: `${TICKET_ATTACHMENT_URL_PREFIX}${encodeURIComponent(ticket.attachmentFileName)}`,
    },
  ]
}

export const getPrimaryTicketAttachment = (ticket: TicketWithAttachments) => getTicketAttachments(ticket)[0] ?? null
