CREATE OR REPLACE VIEW "public"."account_value_over_time" AS (
  WITH weekly_data AS (
    SELECT 
      user_id,
      DATE_TRUNC('week', date)::date as week_start,
      -- Weekly transfers (money wire in/out)
      SUM(CASE WHEN action = 'transfer' THEN amount::numeric ELSE 0 END) as weekly_transfers,
      -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
      SUM(CASE 
        WHEN action != 'transfer' THEN amount::numeric - fees::numeric
        ELSE 0
      END) as weekly_gains
    FROM transactions
    WHERE action != 'other' AND date <= CURRENT_DATE
    GROUP BY user_id, DATE_TRUNC('week', date)
  )
  SELECT 
    user_id,
    week_start,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_transfers,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) + 
    SUM(weekly_gains) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_portfolio_value
  FROM weekly_data
  ORDER BY user_id, week_start
);

CREATE OR REPLACE VIEW "public"."weekly_performance" AS (select "user_id", DATE_TRUNC('week', "date")::date as "week_start", SUM("amount"::numeric) - SUM("fees"::numeric) as "weekly_pnl", COUNT(*) as "transaction_count" from "transactions" where "transactions"."action" NOT IN ('transfer', 'other') AND "transactions"."date" <= CURRENT_DATE group by "transactions"."user_id", DATE_TRUNC('week', "transactions"."date") order by "transactions"."user_id", week_start DESC);