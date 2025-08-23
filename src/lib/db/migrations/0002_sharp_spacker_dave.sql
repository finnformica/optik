CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"action" varchar(50) NOT NULL,
	"ticker" varchar(50) NOT NULL,
	"description" text,
	"quantity" numeric(18, 8) NOT NULL,
	"fees" numeric(18, 8) DEFAULT '0' NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"broker" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;