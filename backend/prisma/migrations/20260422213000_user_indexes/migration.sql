CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "User"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_user_role_created_at" ON "User"("roleId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_user_name" ON "User"("name");
