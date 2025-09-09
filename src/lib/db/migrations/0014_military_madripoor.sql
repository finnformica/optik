DROP VIEW "public"."view_weekly_returns";--> statement-breakpoint
CREATE VIEW "public"."view_weekly_returns" AS (
  WITH weekly_data AS (
    SELECT 
      a.user_id,
      d.week_ending_date as week_start,
      -- Weekly transfers (money wire in/out)
      SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
      -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
      SUM(CASE 
        WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount
        ELSE 0
      END) as weekly_gains
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
      SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_transfers,
      SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) + 
      SUM(weekly_gains) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_portfolio_value
    FROM weekly_data
  ),
  
  returns_data AS (
    SELECT 
      user_id,
      week_start,
      weekly_gains,
      weekly_transfers,
      LAG(cumulative_portfolio_value - cumulative_transfers, 1) OVER (PARTITION BY user_id ORDER BY week_start) as portfolio_value_start,
      (cumulative_portfolio_value - cumulative_transfers) as portfolio_value_end,
      
      -- Calculate weekly return percentage with zero division protection
      CASE 
        WHEN LAG(cumulative_portfolio_value - cumulative_transfers, 1) OVER (PARTITION BY user_id ORDER BY week_start) = 0 THEN 0
        ELSE (((cumulative_portfolio_value - cumulative_transfers) - LAG(cumulative_portfolio_value - cumulative_transfers, 1) OVER (PARTITION BY user_id ORDER BY week_start)) / LAG(cumulative_portfolio_value - cumulative_transfers, 1) OVER (PARTITION BY user_id ORDER BY week_start) * 100)
      END as weekly_return_percent
      
    FROM cumulative_data
    WHERE week_start >= CURRENT_DATE - INTERVAL '1 year'  -- Only last year of data
  )
  
  SELECT 
    user_id,
    week_start,
    weekly_gains,
    weekly_transfers,
    portfolio_value_start,
    portfolio_value_end,
    weekly_return_percent
    
  FROM returns_data
  WHERE portfolio_value_start IS NOT NULL  -- Exclude first week with NULL starting value
  ORDER BY user_id, week_start
);