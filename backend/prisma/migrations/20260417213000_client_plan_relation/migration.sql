-- Add new relational plan reference on clients
ALTER TABLE "Client" ADD COLUMN "planId" TEXT;

-- Bootstrap plans from legacy free-text plan values when needed.
-- We only create migrated plans for non-empty values that do not already exist by name.
INSERT INTO "Plan" ("id", "name", "speedDown", "speedUp", "price", "active", "createdAt", "updatedAt")
SELECT
  'plan-migrated-' || SUBSTRING(md5(random()::text || clock_timestamp()::text), 1, 20),
  legacy_plan."plan",
  0,
  0,
  0.01,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT TRIM("plan") AS "plan"
  FROM "Client"
  WHERE COALESCE(TRIM("plan"), '') <> ''
) AS legacy_plan
LEFT JOIN "Plan" existing_plan ON LOWER(existing_plan."name") = LOWER(legacy_plan."plan")
WHERE existing_plan."id" IS NULL;

-- Backfill planId by matching legacy text value against plan name
UPDATE "Client" c
SET "planId" = p."id"
FROM "Plan" p
WHERE COALESCE(TRIM(c."plan"), '') <> ''
  AND LOWER(p."name") = LOWER(TRIM(c."plan"));

-- Drop legacy free-text plan and enforce FK
ALTER TABLE "Client" DROP COLUMN "plan";
ALTER TABLE "Client" ADD CONSTRAINT "Client_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Client_planId_idx" ON "Client"("planId");
