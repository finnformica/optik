DROP VIEW "public"."view_weekly_return";--> statement-breakpoint
CREATE VIEW "public"."view_weekly_return" WITH (security_invoker = true) AS (
  WITH weekly_transfers AS (
    -- Calculate weekly transfers separately for returns calculation
    SELECT
      a.account_key,
      d.week_starting_date as week_start,
      SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
      SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date <= CURRENT_DATE
    GROUP BY a.account_key, d.week_starting_date
  ),

  portfolio_with_transfers AS (
    -- Combine portfolio values with transfer data
    SELECT
      wpv.account_key,
      wpv.week_start,
      wpv.total_portfolio_value as cumulative_portfolio_value,
      wpv.cumulative_transfers,
      COALESCE(wt.weekly_transfers, 0) as weekly_transfers,
      COALESCE(wt.weekly_gains, 0) as weekly_gains
    FROM "view_weekly_portfolio_value" wpv
    LEFT JOIN weekly_transfers wt ON wpv.account_key = wt.account_key
      AND wpv.week_start = wt.week_start
  ),

  returns_calculation AS (
    SELECT
      account_key,
      week_start,
      cumulative_portfolio_value,
      cumulative_transfers,
      weekly_transfers,
      weekly_gains as weekly_return_absolute,
      -- LAG calculation for previous week's portfolio value
      LAG(cumulative_portfolio_value, 1) OVER (
        PARTITION BY account_key
        ORDER BY week_start
      ) as prev_week_portfolio_value
    FROM portfolio_with_transfers
  )

  SELECT
    account_key,
    week_start,
    cumulative_portfolio_value,
    cumulative_transfers,
    weekly_return_absolute,
    -- Weekly return calculation: handle first week properly
    CASE
      WHEN prev_week_portfolio_value > 0 THEN
        -- Normal case: previous week portfolio value exists
        ((cumulative_portfolio_value - weekly_transfers - prev_week_portfolio_value)
          / prev_week_portfolio_value) * 100
      WHEN prev_week_portfolio_value IS NULL AND cumulative_transfers > 0 THEN
        -- First week case: use weekly gains relative to transfers
        (weekly_return_absolute / cumulative_transfers) * 100
      ELSE NULL
    END as weekly_return_percent
  FROM returns_calculation
  ORDER BY account_key, week_start
);