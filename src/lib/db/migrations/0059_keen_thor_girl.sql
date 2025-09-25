ALTER TABLE "dim_account" DROP CONSTRAINT "dim_account_user_id_dim_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dim_account_access_token" DROP CONSTRAINT "dim_account_access_token_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_account_access_token" DROP CONSTRAINT "dim_account_access_token_broker_code_dim_broker_broker_code_fk";
--> statement-breakpoint
ALTER TABLE "dim_broker_account" DROP CONSTRAINT "dim_broker_account_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_broker_account" DROP CONSTRAINT "dim_broker_account_broker_key_dim_broker_broker_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_user" DROP CONSTRAINT "dim_user_auth_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fact_transaction_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "rtm_sync_progress" DROP CONSTRAINT "rtm_sync_progress_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "stg_transaction" DROP CONSTRAINT "stg_transaction_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_account" ADD CONSTRAINT "dim_account_user_id_dim_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dim_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account_access_token" ADD CONSTRAINT "dim_account_access_token_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account_access_token" ADD CONSTRAINT "dim_account_access_token_broker_code_dim_broker_broker_code_fk" FOREIGN KEY ("broker_code") REFERENCES "public"."dim_broker"("broker_code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_broker_account" ADD CONSTRAINT "dim_broker_account_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_broker_account" ADD CONSTRAINT "dim_broker_account_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rtm_sync_progress" ADD CONSTRAINT "rtm_sync_progress_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stg_transaction" ADD CONSTRAINT "stg_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE cascade ON UPDATE no action;