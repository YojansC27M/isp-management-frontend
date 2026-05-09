-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('pending', 'scheduled', 'installed', 'suspended', 'canceled');

-- CreateEnum
CREATE TYPE "InstallationOperationType" AS ENUM ('installation', 'relocation', 'replacement', 'removal');

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "visitId" TEXT,
    "routerId" TEXT,
    "operationType" "InstallationOperationType" NOT NULL DEFAULT 'installation',
    "status" "InstallationStatus" NOT NULL DEFAULT 'pending',
    "installedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationMovement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "installationId" TEXT,
    "visitId" TEXT,
    "routerId" TEXT,
    "operationType" "InstallationOperationType" NOT NULL,
    "status" "InstallationStatus" NOT NULL,
    "notes" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Installation_clientId_key" ON "Installation"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_visitId_key" ON "Installation"("visitId");

-- CreateIndex
CREATE INDEX "idx_installation_router_status_created_at" ON "Installation"("routerId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_installation_visit" ON "Installation"("visitId");

-- CreateIndex
CREATE INDEX "idx_installation_movement_client_happened_at" ON "InstallationMovement"("clientId", "happenedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_installation_movement_installation_happened_at" ON "InstallationMovement"("installationId", "happenedAt" DESC);

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "Router"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMovement" ADD CONSTRAINT "InstallationMovement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMovement" ADD CONSTRAINT "InstallationMovement_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMovement" ADD CONSTRAINT "InstallationMovement_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationMovement" ADD CONSTRAINT "InstallationMovement_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "Router"("id") ON DELETE SET NULL ON UPDATE CASCADE;
