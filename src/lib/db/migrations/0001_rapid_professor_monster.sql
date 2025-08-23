CREATE TABLE "user_access_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"scope" varchar(255) NOT NULL,
	"provider" varchar(50) DEFAULT 'schwab' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD CONSTRAINT "user_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;