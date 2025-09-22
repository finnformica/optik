CREATE TABLE "rtm_sync_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_key" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"message" text NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"remaining" integer DEFAULT 0 NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rtm_sync_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rtm_sync_progress" ADD CONSTRAINT "rtm_sync_progress_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "users_own_sync_progress" ON "rtm_sync_progress" AS PERMISSIVE FOR ALL TO "authenticated" USING ("rtm_sync_progress"."account_key" IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      ));