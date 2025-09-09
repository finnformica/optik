DROP VIEW "public"."view_weekly_returns";--> statement-breakpoint
CREATE VIEW "public"."view_weekly_returns" AS (
  WITH weekly_data AS (
      SELECT 
          a.user_id,
          d.week_ending_date as week_start,
          -- Weekly transfers (money wire in/out)
          SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
          -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
          SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
      FROM "fact_transactions" ft
      JOIN "dim_date" d ON ft.date_key = d.date_key
      JOIN "dim_account" a ON ft.account_key = a.account_key
      JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
      WHERE d.full_date <= CURRENT_DATE
      GROUP BY a.user_id, d.week_ending_date
  ),

  cumulative_data AS (
      SELECT 
          user_id,
          week_start,
          weekly_transfers,
          weekly_gains,
          -- Cumulative calculations
          SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_transfers,
          SUM(weekly_transfers + weekly_gains) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_portfolio_value
      FROM weekly_data
  ),

  lagged_data AS (
      SELECT 
          user_id,
          week_start,
          weekly_gains,
          weekly_transfers,
          cumulative_portfolio_value,
          cumulative_transfers,
          -- LAG calculation for previous week's portfolio value
          LAG(cumulative_portfolio_value, 1) OVER (PARTITION BY user_id ORDER BY week_start) as prev_week_portfolio_value
      FROM cumulative_data
  ),

  returns_calculation AS (
      SELECT 
          user_id,
          week_start,
          weekly_transfers,
          cumulative_portfolio_value,
          cumulative_transfers,
          prev_week_portfolio_value,
          weekly_gains as weekly_return_absolute,
          -- Weekly return calculation: subtract transfers to avoid spikes
          CASE 
              WHEN prev_week_portfolio_value > 0 
              THEN ((cumulative_portfolio_value - weekly_transfers - prev_week_portfolio_value) 
                    / prev_week_portfolio_value) * 100
              ELSE NULL
          END as weekly_return_percent
      FROM lagged_data
      WHERE prev_week_portfolio_value IS NOT NULL
  )

  SELECT 
      user_id,
      week_start,
      cumulative_portfolio_value,
      cumulative_transfers,
      weekly_return_percent,
      weekly_return_absolute
  FROM returns_calculation
  ORDER BY user_id, week_start
);