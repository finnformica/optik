CREATE VIEW "public"."view_account_returns" AS (
  WITH weekly_returns AS (
    SELECT 
      user_id,
      account_key,
      week_start,
      cumulative_transfers,
      cumulative_portfolio_value,
      
      -- Calculate weekly transfers (new money in/out this week)
      cumulative_transfers - LAG(cumulative_transfers, 1, 0) OVER (
        PARTITION BY account_key 
        ORDER BY week_start
      ) as weekly_transfers,
      
      -- Get previous week's portfolio value
      LAG(cumulative_portfolio_value, 1, 0) OVER (
        PARTITION BY account_key 
        ORDER BY week_start
      ) as previous_portfolio_value,
      
      -- Calculate total weekly change (including transfers)
      cumulative_portfolio_value - LAG(cumulative_portfolio_value, 1, 0) OVER (
        PARTITION BY account_key 
        ORDER BY week_start
      ) as total_weekly_change
      
    FROM view_account_value_over_time
  )
  SELECT 
    user_id,
    account_key,
    week_start,
    cumulative_transfers,
    cumulative_portfolio_value,
    weekly_transfers,
    
    -- Weekly gains = total change minus new transfers
    total_weekly_change - weekly_transfers as weekly_gains,
    
    -- Absolute return = weekly gains (performance excluding transfers)
    total_weekly_change - weekly_transfers as absolute_return,
    
    -- Percent return = weekly gains / previous portfolio value * 100
    CASE 
      WHEN previous_portfolio_value > 0 
      THEN ROUND(((total_weekly_change - weekly_transfers) / previous_portfolio_value * 100)::numeric, 4)
      ELSE 0
    END as percent_return,
    
    previous_portfolio_value
    
  FROM weekly_returns
  WHERE previous_portfolio_value IS NOT NULL  -- Skip first week (no previous value)
  ORDER BY account_key, week_start
);