CREATE OR REPLACE VIEW "public"."view_weekly_portfolio_value" WITH (security_invoker = true) AS (
  WITH weekly_date_series AS (
    -- Generate all weeks from earliest transaction to current date
    SELECT DISTINCT
      week_start,
      account_key
    FROM "view_weekly_position"
  ),

  weekly_cash_flows AS (
    -- Calculate cumulative cash flows up to each week
    SELECT
      wds.account_key,
      wds.week_start,
      COALESCE(SUM(ft.net_amount), 0) as cash_flows_to_date
    FROM weekly_date_series wds
    LEFT JOIN "fact_transaction" ft ON ft.account_key = wds.account_key
    LEFT JOIN "dim_date" d ON ft.date_key = d.date_key
    WHERE d.week_starting_date <= wds.week_start OR ft.transaction_key IS NULL
    GROUP BY wds.account_key, wds.week_start
  ),

  weekly_transfers AS (
    -- Calculate cumulative transfers up to each week
    SELECT
      wds.account_key,
      wds.week_start,
      COALESCE(SUM(
        CASE WHEN tt.action_category = 'TRANSFER'
        THEN ft.net_amount
        ELSE 0 END
      ), 0) as cumulative_transfers
    FROM weekly_date_series wds
    LEFT JOIN "fact_transaction" ft ON ft.account_key = wds.account_key
    LEFT JOIN "dim_date" d ON ft.date_key = d.date_key
    LEFT JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.week_starting_date <= wds.week_start OR ft.transaction_key IS NULL
    GROUP BY wds.account_key, wds.week_start
  )

  SELECT
    wcf.account_key,
    wcf.week_start,
    wcf.cash_flows_to_date as cash_flows,

    -- Stock position values from weekly positions (use premium cost basis)
    COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM "view_weekly_position" vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'STOCK'
       AND vwp.position_status = 'OPEN'), 0
    ) as stock_position_value,

    -- Option collateral values using position_value (accounts for CALL=0, PUT=collateral)
    COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM "view_weekly_position" vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'OPTION'
       AND vwp.position_status = 'OPEN'), 0
    ) as option_collateral_value,

    -- Cumulative transfers
    wt.cumulative_transfers,

    -- Total portfolio value = cash flows + stock position values
    wcf.cash_flows_to_date + COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM "view_weekly_position" vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'STOCK'
       AND vwp.position_status = 'OPEN'), 0
    ) as total_portfolio_value,

    -- Available cash = cash flows - option collateral (using position_value)
    wcf.cash_flows_to_date - COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM "view_weekly_position" vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'OPTION'
       AND vwp.position_status = 'OPEN'), 0
    ) as available_cash

  FROM weekly_cash_flows wcf
  JOIN weekly_transfers wt ON wcf.account_key = wt.account_key
    AND wcf.week_start = wt.week_start
  ORDER BY wcf.account_key, wcf.week_start
);--> statement-breakpoint
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
    pc.account_key,
    pc.week_start,
    pc.symbol,
    pc.security_type,
    pc.underlying_symbol,
    pc.cumulative_quantity as quantity,
    pc.avg_cost_per_unit,
    pc.first_transaction_date,
    pc.last_transaction_date,

    -- Position value: stocks use cost basis, puts use collateral value, calls use stock as collateral (zero cash)
    CASE
      WHEN ds.security_type = 'STOCK' THEN ABS(pc.cumulative_quantity) * pc.avg_cost_per_unit
      WHEN ds.security_type = 'OPTION' AND ds.option_type = 'PUT' THEN ABS(pc.cumulative_quantity) * ds.strike_price * 100
      WHEN ds.security_type = 'OPTION' AND ds.option_type = 'CALL' THEN 0
      ELSE ABS(pc.cumulative_quantity) * pc.avg_cost_per_unit
    END as position_value,

    'OPEN' as position_status,
    0 as unrealized_pnl,
    ds.expiry_date,
    ds.option_type,
    ds.strike_price

  FROM position_calculations pc
  LEFT JOIN "dim_security" ds ON pc.symbol = ds.symbol
  ORDER BY pc.account_key, pc.week_start, pc.symbol
);