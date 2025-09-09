ALTER TABLE "fact_current_positions" DROP CONSTRAINT "fact_current_positions_account_key_security_key_pk";--> statement-breakpoint
ALTER TABLE "fact_current_positions" ALTER COLUMN "security_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fact_transactions" ALTER COLUMN "security_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fact_current_positions" ADD COLUMN "position_key" serial PRIMARY KEY NOT NULL;