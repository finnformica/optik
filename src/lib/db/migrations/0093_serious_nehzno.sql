CREATE OR REPLACE VIEW "public"."view_current_portfolio_value" WITH (security_invoker = true) AS (
  SELECT
    wpv.account_key,
    wpv.cash_flows,
    wpv.stock_position_value,
    wpv.option_collateral_value,
    wpv.cumulative_transfers,
    wpv.total_portfolio_value,
    wpv.available_cash
  FROM "view_weekly_portfolio_value" wpv
  INNER JOIN (
    SELECT account_key, MAX(week_start) as max_week_start
    FROM "view_weekly_portfolio_value"
    GROUP BY account_key
  ) latest_weeks ON wpv.account_key = latest_weeks.account_key
    AND wpv.week_start = latest_weeks.max_week_start
);--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."view_portfolio_summary" WITH (security_invoker = true) AS (
  WITH realised_monthly_pnl AS (
    -- Realised P/L for current month using viewStockProfit for stocks
    SELECT
      a.account_key,
      -- Non-stock trades (options, dividends, etc.) as direct cash flow
      SUM(CASE
        WHEN ds.security_type != 'STOCK' THEN ft.net_amount
        ELSE 0
      END) +
      -- Stock realized profits from viewStockProfit (only actual realized gains/losses)
      COALESCE(SUM(CASE
        WHEN ds.security_type = 'STOCK' THEN vsp.realized_profit
        ELSE 0
      END), 0) as monthly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    LEFT JOIN "view_stock_profit" vsp ON ft.account_key = vsp.account_key
      AND ft.transaction_key = vsp.transaction_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  realised_yearly_pnl AS (
    -- Realised P/L for current year using viewStockProfit for stocks
    SELECT
      a.account_key,
      -- Non-stock trades (options, dividends, etc.) as direct cash flow
      SUM(CASE
        WHEN ds.security_type != 'STOCK' THEN ft.net_amount
        ELSE 0
      END) +
      -- Stock realized profits from viewStockProfit (only actual realized gains/losses)
      COALESCE(SUM(CASE
        WHEN ds.security_type = 'STOCK' THEN vsp.realized_profit
        ELSE 0
      END), 0) as yearly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    LEFT JOIN "view_stock_profit" vsp ON ft.account_key = vsp.account_key
      AND ft.transaction_key = vsp.transaction_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  total_transfers_calc AS (
    -- Calculate total transfers (money deposited/withdrawn)
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_transfers
    FROM "fact_transaction" ft
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category = 'TRANSFER'
    GROUP BY a.account_key
  ),

  portfolio_value_start_of_month AS (
    -- Calculate portfolio value at start of month using viewWeeklyPortfolioValue
    SELECT
      wpv.account_key,
      wpv.total_portfolio_value as portfolio_value_start_month
    FROM "view_weekly_portfolio_value" wpv
    WHERE wpv.week_start = (
      SELECT MAX(week_start)
      FROM "view_weekly_portfolio_value" wpv2
      WHERE wpv2.account_key = wpv.account_key
      AND wpv2.week_start < DATE_TRUNC('month', CURRENT_DATE)
    )
  ),

  portfolio_value_start_of_year AS (
    -- Calculate portfolio value at start of year using viewWeeklyPortfolioValue
    SELECT
      wpv.account_key,
      wpv.total_portfolio_value as portfolio_value_start_year
    FROM "view_weekly_portfolio_value" wpv
    WHERE wpv.week_start = (
      SELECT MAX(week_start)
      FROM "view_weekly_portfolio_value" wpv2
      WHERE wpv2.account_key = wpv.account_key
      AND wpv2.week_start < DATE_TRUNC('year', CURRENT_DATE)
    )
  )

  -- Final summary query using viewWeeklyPortfolioValue
  SELECT
    a.account_key,
    COALESCE(pv.total_portfolio_value, 0) as portfolio_value,
    COALESCE(pv.cash_flows, 0) as cash_balance,
    COALESCE(pv.available_cash, 0) as available_cash,
    COALESCE(pv.stock_position_value, 0) as stock_position_value,
    COALESCE(pv.option_collateral_value, 0) as option_collateral_value,
    COALESCE(mp.monthly_realised_pnl, 0) as monthly_pnl,
    COALESCE(yp.yearly_realised_pnl, 0) as yearly_pnl,

    -- Calculate percentage changes based on realized P&L vs portfolio value
    CASE
      WHEN COALESCE(pvsm.portfolio_value_start_month, 0) > 0
      THEN (COALESCE(mp.monthly_realised_pnl, 0) / pvsm.portfolio_value_start_month * 100)
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as monthly_pnl_percent,

    CASE
      WHEN COALESCE(pvsy.portfolio_value_start_year, 0) > 0
      THEN (COALESCE(yp.yearly_realised_pnl, 0) / pvsy.portfolio_value_start_year * 100)
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as yearly_pnl_percent,

    CASE
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as overall_percent_increase

  FROM "dim_account" a
  LEFT JOIN "view_current_portfolio_value" pv ON a.account_key = pv.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN total_transfers_calc tt ON a.account_key = tt.account_key
  LEFT JOIN portfolio_value_start_of_month pvsm ON a.account_key = pvsm.account_key
  LEFT JOIN portfolio_value_start_of_year pvsy ON a.account_key = pvsy.account_key
  WHERE a.is_active = true
);