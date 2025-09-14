ALTER TABLE "user_access_tokens" DROP CONSTRAINT "unique_user_broker_token";--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD COLUMN "broker_code" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD CONSTRAINT "user_access_tokens_broker_code_dim_broker_broker_code_fk" FOREIGN KEY ("broker_code") REFERENCES "public"."dim_broker"("broker_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_tokens" DROP COLUMN "broker";--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD CONSTRAINT "unique_user_broker_token" UNIQUE("user_id","broker_code");