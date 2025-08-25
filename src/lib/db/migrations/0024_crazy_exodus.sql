DROP VIEW "public"."weekly_performance";--> statement-breakpoint
CREATE VIEW "public"."weekly_performance" AS (
  SELECT 
    user_id,
    week_start,
    -- Weekly P&L = this week's value - last week's value
    cumulative_portfolio_value::numeric - 
    LAG(cumulative_portfolio_value::numeric) OVER (PARTITION BY user_id ORDER BY week_start) as weekly_pnl,
    -- Weekly percentage = weekly P&L / previous portfolio value * 100
    CASE 
      WHEN LAG(cumulative_portfolio_value::numeric) OVER (PARTITION BY user_id ORDER BY week_start) > 0
      THEN (
        cumulative_portfolio_value::numeric - 
        LAG(cumulative_portfolio_value::numeric) OVER (PARTITION BY user_id ORDER BY week_start)
      ) * 100.0 / LAG(cumulative_portfolio_value::numeric) OVER (PARTITION BY user_id ORDER BY week_start)
      ELSE 0
    END as weekly_pnl_percent
  FROM account_value_over_time
  ORDER BY user_id, week_start DESC
);