DROP VIEW "public"."view_account_value_over_time";--> statement-breakpoint
CREATE VIEW "public"."view_account_value_over_time" AS (
  WITH weekly_data AS (
    SELECT 
      a.user_id,
      d.week_ending_date as week_start,
      -- Weekly transfers (money wire in/out) - no direction needed, amounts already signed
      SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
      -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
      SUM(CASE 
        WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount
        ELSE 0
      END) as weekly_gains
    FROM fact_transactions ft
    JOIN dim_date d ON ft.date_key = d.date_key
    JOIN dim_account a ON ft.account_key = a.account_key
    JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date <= CURRENT_DATE
    GROUP BY a.user_id, d.week_ending_date
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