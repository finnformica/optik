ALTER TABLE "dim_user" RENAME COLUMN "name" TO "first_name";--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "last_name" varchar(50);