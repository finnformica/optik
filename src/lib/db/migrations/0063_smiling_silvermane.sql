CREATE VIEW "public"."view_portfolio_value" WITH (security_invoker = true) AS (
  SELECT
    a.account_key,

    -- Raw cash flows from all transactions
    SUM(ft.net_amount) as cash_flows,

    -- Stock position values (at cost basis)
    -- TODO: Replace with market value calculation when ready (current_price * quantity)
    COALESCE(
      (SELECT SUM(position_value)
       FROM "view_position" vp
       WHERE vp.account_key = a.account_key
       AND vp.position_status = 'OPEN'
       AND vp.security_type = 'STOCK'), 0
    ) as stock_position_value,

    -- Option collateral requirements (cash locked up for margin)
    COALESCE(
      (SELECT SUM(position_value)
       FROM "view_position" vp
       WHERE vp.account_key = a.account_key
       AND vp.position_status = 'OPEN'
       AND vp.security_type = 'OPTION'), 0
    ) as option_collateral_value,

    -- Total portfolio value = cash flows + stock position values
    -- Note: Options don't add value, they just require collateral
    SUM(ft.net_amount) + COALESCE(
      (SELECT SUM(position_value)
       FROM "view_position" vp
       WHERE vp.account_key = a.account_key
       AND vp.position_status = 'OPEN'
       AND vp.security_type = 'STOCK'), 0
    ) as total_portfolio_value,

    -- Available cash = raw cash flows - option collateral requirements
    SUM(ft.net_amount) - COALESCE(
      (SELECT SUM(position_value)
       FROM "view_position" vp
       WHERE vp.account_key = a.account_key
       AND vp.position_status = 'OPEN'
       AND vp.security_type = 'OPTION'), 0
    ) as available_cash

  FROM "fact_transaction" ft
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  GROUP BY a.account_key
);