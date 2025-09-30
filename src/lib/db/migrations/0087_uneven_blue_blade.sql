-- Custom SQL migration file, put your code below! --
-- Re-enable RLS and create proper policy for rtm_sync_progress table
-- This ensures the table is secured and matches the current RLS pattern

-- Enable RLS on rtm_sync_progress table (in case it's not enabled)
ALTER TABLE rtm_sync_progress ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "users_own_sync_progress" ON rtm_sync_progress;

-- Create policy that matches the modern pattern used in other tables
CREATE POLICY "users_own_sync_progress" ON rtm_sync_progress
    AS PERMISSIVE FOR ALL TO authenticated
    USING (rtm_sync_progress.account_key IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
    ));