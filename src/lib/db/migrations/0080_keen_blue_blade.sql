ALTER TABLE "dim_user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dim_user" drop column "role";--> statement-breakpoint
ALTER TABLE "dim_user" ADD COLUMN "role" varchar(20) GENERATED ALWAYS AS (
      CASE
        WHEN role_override IS NOT NULL THEN role_override
        WHEN subscription_status IN ('active', 'trialing') THEN 'pro'
        ELSE 'basic'
      END
    ) STORED NOT NULL;