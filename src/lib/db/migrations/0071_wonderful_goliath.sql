DROP VIEW "public"."view_portfolio_summary";--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_summary" WITH (security_invoker = true) AS (
  WITH realised_monthly_pnl AS (
    -- Realised P/L for current month including stock position adjustments
    -- Note: Stock purchases show as negative cash flow but create equivalent asset value
    -- This calculation accounts for both to show true realized P&L from trading
    SELECT
      a.account_key,
      -- Raw cash flows from trades and income this month
      SUM(ft.net_amount) + COALESCE(
        -- Add back stock position values for trades that happened this month
        -- This prevents stock purchases from appearing as "losses" in P&L
        (SELECT SUM(position_value)
         FROM "view_position" vp
         WHERE vp.account_key = a.account_key
         AND vp.position_status = 'OPEN'
         AND vp.security_type = 'STOCK'
         AND DATE_TRUNC('month', vp.first_transaction_date) = DATE_TRUNC('month', CURRENT_DATE)), 0
      ) as monthly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  realised_yearly_pnl AS (
    -- Realised P/L for current year including stock position adjustments
    -- Note: Stock purchases show as negative cash flow but create equivalent asset value
    -- This calculation accounts for both to show true realized P&L from trading
    SELECT
      a.account_key,
      -- Raw cash flows from trades and income this year
      SUM(ft.net_amount) + COALESCE(
        -- Add back stock position values for trades that happened this year
        -- This prevents stock purchases from appearing as "losses" in P&L
        (SELECT SUM(position_value)
         FROM "view_position" vp
         WHERE vp.account_key = a.account_key
         AND vp.position_status = 'OPEN'
         AND vp.security_type = 'STOCK'
         AND EXTRACT(YEAR FROM vp.first_transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0
      ) as yearly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
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
    -- Calculate portfolio value at start of month using same logic as viewPortfolioValue
    SELECT
      a.account_key,
      SUM(ft.net_amount) + COALESCE(
        (SELECT SUM(position_value)
         FROM "view_position" vp
         WHERE vp.account_key = a.account_key
         AND vp.position_status = 'OPEN'
         AND vp.security_type = 'STOCK'
         AND vp.first_transaction_date < DATE_TRUNC('month', CURRENT_DATE)), 0
      ) as portfolio_value_start_month
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY a.account_key
  ),

  portfolio_value_start_of_year AS (
    -- Calculate portfolio value at start of year using same logic as viewPortfolioValue
    SELECT
      a.account_key,
      SUM(ft.net_amount) + COALESCE(
        (SELECT SUM(position_value)
         FROM "view_position" vp
         WHERE vp.account_key = a.account_key
         AND vp.position_status = 'OPEN'
         AND vp.security_type = 'STOCK'
         AND vp.first_transaction_date < DATE_TRUNC('year', CURRENT_DATE)), 0
      ) as portfolio_value_start_year
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date < DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY a.account_key
  )

  -- Final summary query using viewPortfolioValue
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
      WHEN COALESCE(tt.total_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(tt.total_transfers, 0)) / tt.total_transfers * 100)
      ELSE 0
    END as monthly_pnl_percent,

    CASE
      WHEN COALESCE(pvsy.portfolio_value_start_year, 0) > 0
      THEN (COALESCE(yp.yearly_realised_pnl, 0) / pvsy.portfolio_value_start_year * 100)
      WHEN COALESCE(tt.total_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(tt.total_transfers, 0)) / tt.total_transfers * 100)
      ELSE 0
    END as yearly_pnl_percent,

    CASE
      WHEN COALESCE(tt.total_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(tt.total_transfers, 0)) / tt.total_transfers * 100)
      ELSE 0
    END as overall_percent_increase

  FROM "dim_account" a
  LEFT JOIN (
    SELECT *
    FROM "view_weekly_portfolio_value"
    WHERE week_start = (SELECT MAX(week_start) FROM "view_weekly_portfolio_value")
  ) pv ON a.account_key = pv.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN total_transfers_calc tt ON a.account_key = tt.account_key
  LEFT JOIN portfolio_value_start_of_month pvsm ON a.account_key = pvsm.account_key
  LEFT JOIN portfolio_value_start_of_year pvsy ON a.account_key = pvsy.account_key
  WHERE a.is_active = true
);