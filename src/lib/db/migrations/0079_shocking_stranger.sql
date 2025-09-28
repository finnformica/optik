ALTER TABLE "dim_user" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "subscription_status" varchar(20);--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "plan_name" varchar(50);--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "role_override" varchar(20);