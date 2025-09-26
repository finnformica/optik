DROP VIEW "public"."view_portfolio_value";--> statement-breakpoint
DROP VIEW "public"."view_daily_activity";--> statement-breakpoint
DROP VIEW "public"."view_portfolio_distribution";--> statement-breakpoint
DROP VIEW "public"."view_portfolio_summary";--> statement-breakpoint
CREATE VIEW "public"."view_current_portfolio_value" WITH (security_invoker = true) AS (
  SELECT
    account_key,
    cash_flows,
    stock_position_value,
    option_collateral_value,
    cumulative_transfers,
    total_portfolio_value,
    available_cash
  FROM "view_weekly_portfolio_value"
  WHERE week_start = (SELECT MAX(week_start) FROM "view_weekly_portfolio_value")
);--> statement-breakpoint
CREATE VIEW "public"."view_current_position" WITH (security_invoker = true) AS (
  SELECT
    account_key,
    symbol,
    security_type,
    underlying_symbol,
    quantity,
    avg_cost_per_unit,
    first_transaction_date,
    last_transaction_date,
    position_value,
    position_status,
    unrealized_pnl
  FROM "view_weekly_position"
  WHERE week_start = (SELECT MAX(week_start) FROM "view_weekly_position")
);--> statement-breakpoint
CREATE VIEW "public"."view_daily_activity" WITH (security_invoker = true) AS (
  WITH expiry_range AS (
    -- Find the furthest expiry date to determine our window
    SELECT
        a.account_key,
        COALESCE(MAX(s.expiry_date), CURRENT_DATE) as max_expiry_date
    FROM "dim_account" a
    LEFT JOIN "view_current_position" vp ON a.account_key = vp.account_key
    LEFT JOIN "dim_security" s ON s.symbol = vp.symbol AND s.expiry_date IS NOT NULL AND s.expiry_date >= CURRENT_DATE AND ABS(CAST(vp.quantity AS DECIMAL)) > 0
    WHERE a.is_active = true
    GROUP BY a.account_key
  ),
  all_weekdays AS (
    SELECT d.full_date, er.account_key
    FROM "dim_date" d, expiry_range er
    WHERE d.full_date >= CURRENT_DATE - INTERVAL '6 months'
      AND d.full_date <= er.max_expiry_date
      AND EXTRACT(dow FROM d.full_date) BETWEEN 1 AND 5
  ),
  daily_data AS (
    SELECT
        d.full_date,
        a.account_key,
        SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as daily_transfers,
        SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as daily_gains,
        COUNT(CASE WHEN tt.action_category = 'TRADE' THEN ft.transaction_key END) as trade_count
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date <= CURRENT_DATE
      AND d.full_date >= CURRENT_DATE - INTERVAL '6 months'
      AND EXTRACT(dow FROM d.full_date) BETWEEN 1 AND 5
    GROUP BY a.account_key, d.full_date
  ),
  cumulative_data AS (
    SELECT
        *,
        SUM(daily_transfers) OVER (PARTITION BY account_key ORDER BY full_date) as cumulative_transfers,
        SUM(daily_transfers + daily_gains) OVER (PARTITION BY account_key ORDER BY full_date) as cumulative_portfolio_value
    FROM daily_data
  ),
  with_previous_day AS (
    SELECT
        *,
        LAG(cumulative_portfolio_value) OVER (PARTITION BY account_key ORDER BY full_date) as previous_day_portfolio_value
    FROM cumulative_data
  ),
  daily_returns AS (
    SELECT
        account_key,
        full_date,
        trade_count,
        daily_gains as daily_premium,
        CASE
            WHEN previous_day_portfolio_value IS NOT NULL AND previous_day_portfolio_value != 0
            THEN ROUND((daily_gains / ABS(previous_day_portfolio_value)) * 100, 2)
            ELSE 0
        END as daily_return_percent
    FROM with_previous_day
  ),
  daily_expiries AS (
    SELECT
        s.expiry_date as full_date,
        vp.account_key,
        COUNT(*) as expiring_contracts,
        STRING_AGG(DISTINCT s.underlying_symbol, ', ') as expiring_symbols
    FROM "view_current_position" vp
    JOIN "dim_security" s ON s.symbol = vp.symbol
    WHERE s.expiry_date IS NOT NULL
      AND s.expiry_date >= CURRENT_DATE
      AND ABS(CAST(vp.quantity AS DECIMAL)) > 0
      AND EXTRACT(dow FROM s.expiry_date) BETWEEN 1 AND 5
    GROUP BY s.expiry_date, vp.account_key
  )
  SELECT
      wd.account_key,
      wd.full_date as date,
      COALESCE(dr.trade_count, 0) as trade_count,
      COALESCE(dr.daily_premium, 0) as daily_premium,
      COALESCE(dr.daily_return_percent, 0) as daily_return_percent,
      COALESCE(de.expiring_contracts, 0) as expiring_contracts,
      de.expiring_symbols,
      (wd.full_date = CURRENT_DATE) as is_current_date
  FROM all_weekdays wd
  LEFT JOIN daily_returns dr ON wd.full_date = dr.full_date AND wd.account_key = dr.account_key
  LEFT JOIN daily_expiries de ON wd.full_date = de.full_date AND wd.account_key = de.account_key
  ORDER BY wd.account_key, date DESC
);--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_distribution" WITH (security_invoker = true) AS (
  SELECT
    account_key,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY account_key)) * 100 as portfolio_percentage

  FROM "view_current_position"
  WHERE position_status = 'OPEN'
  GROUP BY account_key, underlying_symbol
  ORDER BY ABS(SUM(position_value)) DESC
);--> statement-breakpoint
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
        (SELECT SUM(vwp.position_value)
         FROM "view_weekly_position" vwp
         WHERE vwp.account_key = a.account_key
         AND vwp.position_status = 'OPEN'
         AND vwp.security_type = 'STOCK'
         AND DATE_TRUNC('month', vwp.first_transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
         AND vwp.week_start = (SELECT MAX(week_start) FROM "view_weekly_position" WHERE account_key = a.account_key)), 0
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
        (SELECT SUM(vwp.position_value)
         FROM "view_weekly_position" vwp
         WHERE vwp.account_key = a.account_key
         AND vwp.position_status = 'OPEN'
         AND vwp.security_type = 'STOCK'
         AND EXTRACT(YEAR FROM vwp.first_transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND vwp.week_start = (SELECT MAX(week_start) FROM "view_weekly_position" WHERE account_key = a.account_key)), 0
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
DROP VIEW "public"."view_position";--> statement-breakpoint