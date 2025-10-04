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

  -- For non-stock securities, use the original calculation
  non_stock_positions AS (
    SELECT
      wds.account_key,
      wds.week_start,
      ds.symbol,
      ds.security_type,
      ds.underlying_symbol,
      SUM(ft.quantity) as cumulative_quantity,
      CASE
        WHEN SUM(ABS(ft.quantity)) > 0
        THEN SUM(ABS(ft.net_amount)) / SUM(ABS(ft.quantity))
        ELSE 0
      END as avg_cost_per_unit,
      MIN(d.full_date) as first_transaction_date,
      MAX(d.full_date) as last_transaction_date,
      ds.expiry_date,
      ds.option_type,
      ds.strike_price
    FROM weekly_date_series wds
    JOIN "fact_transaction" ft ON ft.account_key = wds.account_key
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.week_starting_date <= wds.week_start
      AND tt.action_category IN ('TRADE', 'CORPORATE')
      AND ds.security_type != 'STOCK'  -- Only non-stock securities
    GROUP BY wds.account_key, wds.week_start, ds.symbol, ds.security_type, ds.underlying_symbol, ds.expiry_date, ds.option_type, ds.strike_price
    HAVING SUM(ft.quantity) != 0
  ),

  -- For stocks, use viewStockProfit data aggregated by week
  stock_positions AS (
    SELECT
      wds.account_key,
      wds.week_start,
      vsp.symbol,
      'STOCK'::varchar(20) as security_type,
      vsp.underlying_symbol,
      -- Get the final position at the end of each week
      (SELECT vsp2.running_quantity
       FROM "view_stock_profit" vsp2
       JOIN "dim_date" d2 ON vsp2.transaction_date = d2.full_date
       WHERE vsp2.account_key = wds.account_key
         AND vsp2.symbol = vsp.symbol
         AND d2.week_starting_date <= wds.week_start
       ORDER BY vsp2.transaction_date DESC, vsp2.transaction_key DESC
       LIMIT 1) as cumulative_quantity,
      -- Get the FIFO average cost at the end of each week
      (SELECT vsp2.avg_cost_per_share
       FROM "view_stock_profit" vsp2
       JOIN "dim_date" d2 ON vsp2.transaction_date = d2.full_date
       WHERE vsp2.account_key = wds.account_key
         AND vsp2.symbol = vsp.symbol
         AND d2.week_starting_date <= wds.week_start
       ORDER BY vsp2.transaction_date DESC, vsp2.transaction_key DESC
       LIMIT 1) as avg_cost_per_unit,
      MIN(vsp.transaction_date) as first_transaction_date,
      MAX(vsp.transaction_date) as last_transaction_date,
      NULL as expiry_date,
      NULL as option_type,
      NULL as strike_price
    FROM weekly_date_series wds
    JOIN "view_stock_profit" vsp ON vsp.account_key = wds.account_key
    JOIN "dim_date" d ON vsp.transaction_date = d.full_date
    WHERE d.week_starting_date <= wds.week_start
    GROUP BY wds.account_key, wds.week_start, vsp.symbol, vsp.underlying_symbol
    HAVING (SELECT vsp2.running_quantity
            FROM "view_stock_profit" vsp2
            JOIN "dim_date" d2 ON vsp2.transaction_date = d2.full_date
            WHERE vsp2.account_key = wds.account_key
              AND vsp2.symbol = vsp.symbol
              AND d2.week_starting_date <= wds.week_start
            ORDER BY vsp2.transaction_date DESC, vsp2.transaction_key DESC
            LIMIT 1) > 0  -- Only open positions
  )

  SELECT
    COALESCE(nsp.account_key, sp.account_key) as account_key,
    COALESCE(nsp.week_start, sp.week_start) as week_start,
    COALESCE(nsp.symbol, sp.symbol) as symbol,
    COALESCE(nsp.security_type, sp.security_type) as security_type,
    COALESCE(nsp.underlying_symbol, sp.underlying_symbol) as underlying_symbol,
    COALESCE(nsp.cumulative_quantity, sp.cumulative_quantity) as quantity,
    COALESCE(nsp.avg_cost_per_unit, sp.avg_cost_per_unit) as avg_cost_per_unit,
    COALESCE(nsp.first_transaction_date, sp.first_transaction_date) as first_transaction_date,
    COALESCE(nsp.last_transaction_date, sp.last_transaction_date) as last_transaction_date,

    -- Position value calculation
    CASE
      WHEN COALESCE(nsp.security_type, sp.security_type) = 'STOCK' THEN
        ABS(COALESCE(sp.cumulative_quantity, 0)) * COALESCE(sp.avg_cost_per_unit, 0)
      WHEN nsp.security_type = 'OPTION' AND nsp.option_type = 'PUT' AND nsp.cumulative_quantity < 0 THEN
        ABS(nsp.cumulative_quantity) * nsp.strike_price * 100
      WHEN nsp.security_type = 'OPTION' AND nsp.option_type = 'PUT' AND nsp.cumulative_quantity > 0 THEN 0
      WHEN nsp.security_type = 'OPTION' AND nsp.option_type = 'CALL' AND nsp.cumulative_quantity > 0 THEN
        ABS(nsp.cumulative_quantity) * nsp.strike_price * 100
      WHEN nsp.security_type = 'OPTION' AND nsp.option_type = 'CALL' AND nsp.cumulative_quantity < 0 THEN 0
      ELSE ABS(COALESCE(nsp.cumulative_quantity, 0)) * COALESCE(nsp.avg_cost_per_unit, 0)
    END as position_value,

    'OPEN' as position_status,
    0 as unrealized_pnl,
    nsp.expiry_date,
    nsp.option_type,
    nsp.strike_price

  FROM non_stock_positions nsp
  FULL OUTER JOIN stock_positions sp ON nsp.account_key = sp.account_key
    AND nsp.week_start = sp.week_start
    AND nsp.symbol = sp.symbol
  ORDER BY COALESCE(nsp.account_key, sp.account_key), COALESCE(nsp.week_start, sp.week_start), COALESCE(nsp.symbol, sp.symbol)
);