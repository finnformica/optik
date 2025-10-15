DROP INDEX "idx_broker_account_hash";--> statement-breakpoint
DROP INDEX "idx_dim_time_hour";--> statement-breakpoint
DROP INDEX "idx_dim_time_hour_minute";--> statement-breakpoint
DROP INDEX "idx_dim_user_auth_user_id";--> statement-breakpoint
DROP INDEX "idx_fact_stock_prices_symbol";--> statement-breakpoint
DROP INDEX "idx_fact_stock_prices_created_at";--> statement-breakpoint
CREATE INDEX "idx_dim_account_user_id" ON "dim_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_dim_account_access_token_broker_code" ON "dim_account_access_token" USING btree ("broker_code");--> statement-breakpoint
CREATE INDEX "idx_dim_broker_account_broker_key" ON "dim_broker_account" USING btree ("broker_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_broker_key" ON "fact_transaction" USING btree ("broker_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_transaction_type_key" ON "fact_transaction" USING btree ("transaction_type_key");