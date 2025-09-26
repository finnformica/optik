DROP VIEW "public"."view_weekly_portfolio_value";--> statement-breakpoint
DROP VIEW "public"."view_weekly_return";--> statement-breakpoint
CREATE VIEW "public"."view_weekly_portfolio_value" WITH (security_invoker = true) AS (
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

    -- Option collateral values using strike_price * 100 (matching viewPosition logic)
    COALESCE(
      (SELECT SUM(ds.strike_price * ABS(vwp.quantity) * 100)
       FROM "view_weekly_position" vwp
       JOIN "dim_security" ds ON vwp.symbol = ds.symbol
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

    -- Available cash = cash flows - option collateral
    wcf.cash_flows_to_date - COALESCE(
      (SELECT SUM(ds.strike_price * ABS(vwp.quantity) * 100)
       FROM "view_weekly_position" vwp
       JOIN "dim_security" ds ON vwp.symbol = ds.symbol
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
    -- Weekly return calculation: exclude transfers to avoid spikes
    CASE
      WHEN prev_week_portfolio_value > 0
      THEN ((cumulative_portfolio_value - weekly_transfers - prev_week_portfolio_value)
            / prev_week_portfolio_value) * 100
      ELSE NULL
    END as weekly_return_percent
  FROM returns_calculation
  ORDER BY account_key, week_start
);