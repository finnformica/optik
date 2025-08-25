DROP VIEW "public"."weekly_performance";--> statement-breakpoint
CREATE VIEW "public"."weekly_performance" AS (
  WITH weekly_with_previous AS (
    SELECT 
      user_id,
      week_start,
      cumulative_transfers::numeric as current_transfers,
      cumulative_portfolio_value::numeric as current_portfolio,
      LAG(cumulative_transfers::numeric) OVER (PARTITION BY user_id ORDER BY week_start) as prev_transfers,
      LAG(cumulative_portfolio_value::numeric) OVER (PARTITION BY user_id ORDER BY week_start) as prev_portfolio
    FROM account_value_over_time
  )
  SELECT 
    user_id,
    week_start,
    (current_portfolio - prev_portfolio) - (current_transfers - prev_transfers) as weekly_pnl,
    CASE 
      WHEN prev_portfolio > 0
      THEN ((current_portfolio - prev_portfolio) - (current_transfers - prev_transfers)) * 100.0 / prev_portfolio
      ELSE 0
    END as weekly_pnl_percent
  FROM weekly_with_previous
  WHERE prev_portfolio IS NOT NULL  -- Exclude first week
  ORDER BY user_id, week_start DESC
);