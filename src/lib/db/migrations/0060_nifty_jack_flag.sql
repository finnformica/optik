CREATE VIEW "public"."view_daily_activity" WITH (security_invoker = true) AS (
  WITH expiry_range AS (
    -- Find the furthest expiry date to determine our window
    SELECT
        COALESCE(MAX(s.expiry_date), CURRENT_DATE) as max_expiry_date
    FROM "view_position" vp
    JOIN "dim_security" s ON s.symbol = vp.symbol
    WHERE s.expiry_date IS NOT NULL
      AND s.expiry_date >= CURRENT_DATE
      AND vp.account_key = 1
      AND ABS(CAST(vp.quantity_held AS DECIMAL)) > 0
  ),
  all_weekdays AS (
    SELECT d.full_date
    FROM "dim_date" d, expiry_range er
    WHERE d.full_date >= CURRENT_DATE - INTERVAL '3 months'
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
      AND d.full_date >= CURRENT_DATE - INTERVAL '3 months'
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
    FROM "view_position" vp
    JOIN "dim_security" s ON s.symbol = vp.symbol
    WHERE s.expiry_date IS NOT NULL
      AND s.expiry_date >= CURRENT_DATE
      AND ABS(CAST(vp.quantity_held AS DECIMAL)) > 0
      AND EXTRACT(dow FROM s.expiry_date) BETWEEN 1 AND 5
    GROUP BY s.expiry_date, vp.account_key
  )
  SELECT
      COALESCE(dr.account_key, de.account_key) as account_key,
      wd.full_date as date,
      COALESCE(dr.trade_count, 0) as trade_count,
      COALESCE(dr.daily_premium, 0) as daily_premium,
      COALESCE(dr.daily_return_percent, 0) as daily_return_percent,
      COALESCE(de.expiring_contracts, 0) as expiring_contracts,
      de.expiring_symbols,
      (wd.full_date = CURRENT_DATE) as is_current_date
  FROM all_weekdays wd
  LEFT JOIN daily_returns dr ON wd.full_date = dr.full_date
  LEFT JOIN daily_expiries de ON wd.full_date = de.full_date
  WHERE (dr.account_key IS NOT NULL OR de.account_key IS NOT NULL)
  ORDER BY date DESC
);