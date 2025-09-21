CREATE TABLE "stg_sync_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"account_key" integer NOT NULL,
	"broker_code" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"total_transactions" integer DEFAULT 0,
	"processed_transactions" integer DEFAULT 0,
	"failed_transactions" integer DEFAULT 0,
	"metadata" json,
	"error_message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stg_sync_session_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "stg_sync_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stg_sync_session" ADD CONSTRAINT "stg_sync_session_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sync_session_account" ON "stg_sync_session" USING btree ("account_key","status");--> statement-breakpoint
CREATE INDEX "idx_sync_session_expires" ON "stg_sync_session" USING btree ("expires_at");--> statement-breakpoint
CREATE POLICY "users_own_sync_sessions" ON "stg_sync_session" AS PERMISSIVE FOR ALL TO "authenticated" USING ("stg_sync_session"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));