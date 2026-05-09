-- CreateTable
CREATE TABLE "RouterBackup" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouterBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RouterBackup_routerId_createdAt_idx" ON "RouterBackup"("routerId", "createdAt");

-- AddForeignKey
ALTER TABLE "RouterBackup" ADD CONSTRAINT "RouterBackup_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "Router"("id") ON DELETE CASCADE ON UPDATE CASCADE;

