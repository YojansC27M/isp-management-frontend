CREATE INDEX IF NOT EXISTS "idx_system_setting_internal_user_profile_status"
ON "SystemSetting" ((value->>'status'))
WHERE key LIKE 'internal_user_profile::%';
