CREATE TABLE IF NOT EXISTS "TicketAttachment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_ticket_attachment_ticket_created_at" ON "TicketAttachment"("ticketId", "createdAt" DESC);

ALTER TABLE "TicketAttachment"
ADD CONSTRAINT "TicketAttachment_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
