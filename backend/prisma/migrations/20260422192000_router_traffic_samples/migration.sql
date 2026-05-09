CREATE TABLE "RouterTrafficSample" (
    "id" TEXT NOT NULL,
    "routerId" TEXT NOT NULL,
    "sampledMinute" TIMESTAMP(3) NOT NULL,
    "sampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rxMbps" DOUBLE PRECISION NOT NULL,
    "txMbps" DOUBLE PRECISION NOT NULL,
    "totalMbps" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "RouterTrafficSample_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RouterTrafficSample_routerId_sampledMinute_key"
ON "RouterTrafficSample"("routerId", "sampledMinute");

CREATE INDEX "RouterTrafficSample_sampledMinute_idx"
ON "RouterTrafficSample"("sampledMinute");

CREATE INDEX "RouterTrafficSample_routerId_sampledMinute_idx"
ON "RouterTrafficSample"("routerId", "sampledMinute");

ALTER TABLE "RouterTrafficSample"
ADD CONSTRAINT "RouterTrafficSample_routerId_fkey"
FOREIGN KEY ("routerId") REFERENCES "Router"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
