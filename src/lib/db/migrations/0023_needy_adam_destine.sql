DROP VIEW "public"."weekly_performance";--> statement-breakpoint
CREATE VIEW "public"."weekly_performance" AS (select "user_id", DATE_TRUNC('week', "date")::date as "week_start", SUM("amount"::numeric) - SUM("fees"::numeric) as "weekly_pnl", (
        (SUM("amount"::numeric) - SUM("fees"::numeric) / SUM(CASE 
          WHEN action = 'transfer' THEN amount::numeric 
          ELSE 0 
        END)) * 100 * SUM("quantity"::numeric)
      ) as "weekly_pnl_percent", COUNT(*) as "transaction_count" from "transactions" where "transactions"."action" NOT IN ('transfer', 'other') AND "transactions"."date" <= CURRENT_DATE group by "transactions"."user_id", DATE_TRUNC('week', "transactions"."date") order by "transactions"."user_id", week_start DESC);