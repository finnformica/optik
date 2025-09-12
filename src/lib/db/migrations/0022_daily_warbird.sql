CREATE TABLE "dim_broker_accounts" (
	"broker_account_key" serial PRIMARY KEY NOT NULL,
	"account_key" integer NOT NULL,
	"broker_key" integer NOT NULL,
	"broker_account_number" varchar(50) NOT NULL,
	"broker_account_hash" varchar(100) NOT NULL,
	"broker_account_type" varchar(50),
	"is_active" boolean DEFAULT true,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_broker_account" UNIQUE("account_key","broker_key","broker_account_number")
);
--> statement-breakpoint
ALTER TABLE "dim_broker_accounts" ADD CONSTRAINT "dim_broker_accounts_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_broker_accounts" ADD CONSTRAINT "dim_broker_accounts_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_broker_accounts_account_broker" ON "dim_broker_accounts" USING btree ("account_key","broker_key");--> statement-breakpoint
CREATE INDEX "idx_broker_accounts_hash" ON "dim_broker_accounts" USING btree ("broker_account_hash");