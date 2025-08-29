ALTER TABLE "fact_current_positions" RENAME COLUMN "last_updated" TO "updated_at";--> statement-breakpoint
ALTER TABLE "dim_account" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "dim_broker" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "dim_transaction_type" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "fact_current_positions" ADD COLUMN "created_at" timestamp DEFAULT now();