CREATE VIEW "public"."view_portfolio_summary" AS (
  WITH portfolio_value_calc AS (
    -- Calculate total portfolio value from all transaction flows
    SELECT
      a.user_id,
      SUM(ft.net_amount) as total_portfolio_value
    FROM "fact_transactions" ft
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    GROUP BY a.user_id
  ),

  position_values_calc AS (
    -- Current invested amount (position value of held positions)
    -- Note: position_value can be negative for short positions, positive for long positions
    SELECT
      user_id,
      SUM(position_value) as total_position_value
    FROM "view_positions"
    WHERE position_status = 'OPEN'
    GROUP BY user_id
  ),

  realised_monthly_pnl AS (
    -- Realised P/L for current month
    SELECT
      a.user_id,
      SUM(ft.net_amount) as monthly_realised_pnl
    FROM "fact_transactions" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY a.user_id
  ),

  realised_yearly_pnl AS (
    -- Realised P/L for current year
    SELECT
      a.user_id,
      SUM(ft.net_amount) as yearly_realised_pnl
    FROM "fact_transactions" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY a.user_id
  ),

  realised_weekly_pnl AS (
    -- Realised P/L for current week
    SELECT
      a.user_id,
      SUM(ft.net_amount) as weekly_realised_pnl
    FROM "fact_transactions" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.full_date >= DATE_TRUNC('week', CURRENT_DATE)
      AND d.full_date <= CURRENT_DATE
    GROUP BY a.user_id
  )

  -- Final summary query
  SELECT
    u.id as user_id,
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
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(wp.weekly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as weekly_pnl_percent

  FROM "users" u
  LEFT JOIN portfolio_value_calc pv ON u.id = pv.user_id
  LEFT JOIN position_values_calc pvs ON u.id = pvs.user_id
  LEFT JOIN realised_monthly_pnl mp ON u.id = mp.user_id
  LEFT JOIN realised_yearly_pnl yp ON u.id = yp.user_id
  LEFT JOIN realised_weekly_pnl wp ON u.id = wp.user_id
  WHERE u.deleted_at IS NULL
);