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
  ORDER BY wcf.account_key, wcf.week_start
);