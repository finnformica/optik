ALTER TABLE "dim_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_account_access_token" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_broker" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_broker_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_date" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_security" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_transaction_type" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dim_user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fact_transaction" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stg_transaction" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "users_own_accounts" ON "dim_account" AS PERMISSIVE FOR ALL TO "authenticated" USING ("dim_account"."user_id" = current_setting('app.current_user_id')::int);--> statement-breakpoint
CREATE POLICY "users_own_account_tokens" ON "dim_account_access_token" AS PERMISSIVE FOR ALL TO "authenticated" USING ("dim_account_access_token"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));--> statement-breakpoint
CREATE POLICY "authenticated_can_read_brokers" ON "dim_broker" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "users_own_broker_accounts" ON "dim_broker_account" AS PERMISSIVE FOR ALL TO "authenticated" USING ("dim_broker_account"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));--> statement-breakpoint
CREATE POLICY "authenticated_can_read_dates" ON "dim_date" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "authenticated_can_read_securities" ON "dim_security" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "authenticated_can_read_transaction_types" ON "dim_transaction_type" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "users_own_data" ON "dim_user" AS PERMISSIVE FOR ALL TO "authenticated" USING ("dim_user"."id" = current_setting('app.current_user_id')::int);--> statement-breakpoint
CREATE POLICY "users_own_transactions" ON "fact_transaction" AS PERMISSIVE FOR ALL TO "authenticated" USING ("fact_transaction"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));--> statement-breakpoint
CREATE POLICY "users_own_staging_transactions" ON "stg_transaction" AS PERMISSIVE FOR ALL TO "authenticated" USING ("stg_transaction"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));