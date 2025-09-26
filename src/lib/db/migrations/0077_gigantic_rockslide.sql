CREATE OR REPLACE VIEW "public"."view_daily_activity" WITH (security_invoker = true) AS (
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
        d.week_starting_date,
        a.account_key,
        SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as daily_transfers,
        -- Exclude stock transactions from daily gains since they're balanced by position value
        SUM(CASE
            WHEN tt.action_category NOT IN ('TRANSFER') AND ds.security_type != 'STOCK'
            THEN ft.net_amount
            ELSE 0
        END) as daily_gains,
        COUNT(CASE WHEN tt.action_category = 'TRADE' THEN ft.transaction_key END) as trade_count
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    JOIN "dim_security" ds ON ft.security_key = ds.security_key
    WHERE d.full_date <= CURRENT_DATE
      AND d.full_date >= CURRENT_DATE - INTERVAL '6 months'
      AND EXTRACT(dow FROM d.full_date) BETWEEN 1 AND 5
    GROUP BY a.account_key, d.full_date, d.week_starting_date
  ),
  -- Get weekly portfolio values using corrected stock position handling
  weekly_portfolio_data AS (
    SELECT
        account_key,
        week_start,
        total_portfolio_value,
        LAG(total_portfolio_value) OVER (PARTITION BY account_key ORDER BY week_start) as previous_week_portfolio_value
    FROM "view_weekly_portfolio_value"
    WHERE week_start >= (CURRENT_DATE - INTERVAL '6 months')::date
  ),
  daily_returns AS (
    SELECT
        dd.account_key,
        dd.full_date,
        dd.trade_count,
        dd.daily_gains as daily_premium,
        -- Use weekly portfolio values for percentage calculation
        CASE
            WHEN wpd.previous_week_portfolio_value IS NOT NULL AND wpd.previous_week_portfolio_value != 0
            THEN ROUND((dd.daily_gains / ABS(wpd.previous_week_portfolio_value)) * 100, 2)
            ELSE 0
        END as daily_return_percent
    FROM daily_data dd
    LEFT JOIN weekly_portfolio_data wpd ON dd.account_key = wpd.account_key
      AND dd.week_starting_date = wpd.week_start
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
);