CREATE OR REPLACE VIEW "public"."view_weekly_position" WITH (security_invoker = true) AS (
  WITH weekly_date_series AS (
    -- Get all unique weeks where transactions occurred
    SELECT DISTINCT
      d.week_starting_date as week_start,
      ft.account_key
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    WHERE a.is_active = true
  ),

  position_calculations AS (
    SELECT
      wds.account_key,
      wds.week_start,
      ds.symbol,
      ds.security_type,
      ds.underlying_symbol,

      -- Sum all transactions for this symbol up to and including this week
      SUM(ft.quantity) as cumulative_quantity,
      SUM(ABS(ft.net_amount)) as total_cost,
      SUM(ABS(ft.quantity)) as total_quantity,

      -- Calculate average cost per unit
      CASE
        WHEN SUM(ABS(ft.quantity)) > 0
        THEN SUM(ABS(ft.net_amount)) / SUM(ABS(ft.quantity))
        ELSE 0
      END as avg_cost_per_unit,

      MIN(d.full_date) as first_transaction_date,
      MAX(d.full_date) as last_transaction_date

    FROM weekly_date_series wds
    JOIN "fact_transaction" ft ON ft.account_key = wds.account_key
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.week_starting_date <= wds.week_start  -- Only transactions up to this week
    AND tt.action_category IN ('TRADE', 'CORPORATE')
    GROUP BY wds.account_key, wds.week_start, ds.symbol, ds.security_type, ds.underlying_symbol
    HAVING SUM(ft.quantity) != 0  -- Only positions that are open
  )

  SELECT
    account_key,
    week_start,
    symbol,
    security_type,
    underlying_symbol,
    cumulative_quantity as quantity,
    avg_cost_per_unit,
    first_transaction_date,
    last_transaction_date,

    -- Position value at cost basis
    ABS(cumulative_quantity) * avg_cost_per_unit as position_value,

    'OPEN' as position_status,
    0 as unrealized_pnl

  FROM position_calculations
  ORDER BY account_key, week_start, symbol
);