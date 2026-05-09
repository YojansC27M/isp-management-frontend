ALTER TABLE "Ticket"
ADD COLUMN IF NOT EXISTS "attachmentFileName" TEXT,
ADD COLUMN IF NOT EXISTS "attachmentOriginalName" TEXT,
ADD COLUMN IF NOT EXISTS "attachmentMimeType" TEXT,
ADD COLUMN IF NOT EXISTS "attachmentSizeBytes" INTEGER;
