ALTER TABLE "rtm_sync_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "users_own_sync_progress" ON "rtm_sync_progress" CASCADE;
CREATE POLICY "users_own_sync_progress" ON "rtm_sync_progress" AS PERMISSIVE FOR ALL TO "authenticated" USING ((( SELECT auth.uid() AS uid) IS NOT NULL)) WITH CHECK ("rtm_sync_progress"."account_key" IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
      ));