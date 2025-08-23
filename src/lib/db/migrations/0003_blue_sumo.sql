ALTER TABLE "transactions" ADD COLUMN "strike_price" numeric(18, 8);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "expiry_date" date;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "option_type" varchar(50);