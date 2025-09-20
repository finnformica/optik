DROP VIEW "public"."view_portfolio_summary";--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_summary" AS (
  WITH portfolio_value_calc AS (
    -- Calculate total portfolio value from all transaction flows
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_portfolio_value
    FROM "fact_transaction" ft
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    GROUP BY a.account_key
  ),

  position_values_calc AS (
    -- Current invested amount (position value of held positions)
    -- Note: position_value can be negative for short positions, positive for long positions
    SELECT
      account_key,
      SUM(position_value) as total_position_value
    FROM "view_position"
    WHERE position_status = 'OPEN'
    GROUP BY account_key
  ),

  realised_monthly_pnl AS (
    -- Realised P/L for current month
    SELECT
      a.account_key,
      SUM(ft.net_amount) as monthly_realised_pnl
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
    -- Realised P/L for current year
    SELECT
      a.account_key,
      SUM(ft.net_amount) as yearly_realised_pnl
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
    -- Calculate total transfers (money deposited/withdrawn) to determine initial investment
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_transfers
    FROM "fact_transaction" ft
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category = 'TRANSFER'
    GROUP BY a.account_key
  )

  -- Final summary query
  SELECT
    a.account_key,
    COALESCE(pv.total_portfolio_value, 0) as portfolio_value,
    COALESCE(pv.total_portfolio_value - COALESCE(pvs.total_position_value, 0), pv.total_portfolio_value, 0) as cash_balance,
    COALESCE(mp.monthly_realised_pnl, 0) as monthly_pnl,
    COALESCE(yp.yearly_realised_pnl, 0) as yearly_pnl,

    -- Calculate percentage changes
    CASE
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(mp.monthly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as monthly_pnl_percent,

    CASE
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(yp.yearly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as yearly_pnl_percent,

    CASE
      WHEN COALESCE(tt.total_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(tt.total_transfers, 0)) / tt.total_transfers * 100)
      ELSE 0
    END as overall_percent_increase

  FROM "dim_account" a
  LEFT JOIN portfolio_value_calc pv ON a.account_key = pv.account_key
  LEFT JOIN position_values_calc pvs ON a.account_key = pvs.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN total_transfers_calc tt ON a.account_key = tt.account_key
  WHERE a.is_active = true
);