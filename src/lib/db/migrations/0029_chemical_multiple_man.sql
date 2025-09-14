CREATE TABLE "dim_account_access_tokens" (
	"access_token_key" serial PRIMARY KEY NOT NULL,
	"account_key" integer NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"scope" varchar(255) NOT NULL,
	"broker_code" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_account_broker_token" UNIQUE("account_key","broker_code")
);
--> statement-breakpoint
DROP TABLE "user_access_tokens" CASCADE;--> statement-breakpoint
ALTER TABLE "dim_account_access_tokens" ADD CONSTRAINT "dim_account_access_tokens_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account_access_tokens" ADD CONSTRAINT "dim_account_access_tokens_broker_code_dim_broker_broker_code_fk" FOREIGN KEY ("broker_code") REFERENCES "public"."dim_broker"("broker_code") ON DELETE no action ON UPDATE no action;