ALTER TABLE "rtm_sync_progress" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "users_own_sync_progress" ON "rtm_sync_progress" CASCADE;