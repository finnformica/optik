ALTER TABLE "dim_user" ALTER COLUMN "role" SET DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "dim_user" DROP COLUMN "password_hash";