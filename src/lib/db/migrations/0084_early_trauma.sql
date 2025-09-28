ALTER POLICY "users_own_accounts" ON "dim_account" TO authenticated USING ("dim_account"."user_id" IN (
        SELECT id FROM dim_user WHERE auth_user_id = auth.uid()
      ));--> statement-breakpoint
ALTER POLICY "users_own_account_tokens" ON "dim_account_access_token" TO authenticated USING ("dim_account_access_token"."account_key" IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
      ));--> statement-breakpoint
ALTER POLICY "users_own_broker_accounts" ON "dim_broker_account" TO authenticated USING ("dim_broker_account"."account_key" IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
      ));--> statement-breakpoint
ALTER POLICY "users_own_data" ON "dim_user" TO authenticated USING ("dim_user"."auth_user_id" = auth.uid());--> statement-breakpoint
ALTER POLICY "users_own_transactions" ON "fact_transaction" TO authenticated USING ("fact_transaction"."account_key" IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
      ));--> statement-breakpoint
ALTER POLICY "users_own_staging_transactions" ON "stg_transaction" TO authenticated USING ("stg_transaction"."account_key" IN (
        SELECT account_key FROM dim_account da
        JOIN dim_user du ON da.user_id = du.id
        WHERE du.auth_user_id = auth.uid()
      ));