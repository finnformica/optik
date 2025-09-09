-- Drop dependent views first (in reverse dependency order)
DROP VIEW IF EXISTS "public"."view_portfolio_distribution";

-- Drop the main view
DROP VIEW IF EXISTS "public"."view_positions";

-- Recreate view_positions with the new structure including security_type and option_type
CREATE VIEW "public"."view_positions" AS (
  SELECT 
    a.user_id,
    s.symbol,
    s.underlying_symbol,
    MAX(s.security_type) as security_type,
    MAX(s.option_type) as option_type,
    s.strike_price,
    
    -- Core position metrics from transaction aggregation
    SUM(ft.quantity) as quantity_held,
    SUM(ft.net_amount) as cost_basis,
    SUM(ABS(ft.quantity * ft.price_per_unit)) / NULLIF(SUM(ABS(ft.quantity)), 0) as average_price,
    SUM(ft.fees) as total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN MAX(s.expiry_date) IS NOT NULL 
      THEN (MAX(s.expiry_date) - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position status
    CASE 
      -- Handle expired options
      WHEN MAX(s.security_type) = 'OPTION' AND MAX(s.expiry_date) < CURRENT_DATE THEN 'CLOSED'
      -- Different thresholds for different asset types
      WHEN MAX(s.security_type) = 'OPTION' AND ABS(SUM(ft.quantity)) > 0.001 THEN 'OPEN'
      WHEN MAX(s.security_type) = 'STOCK' AND ABS(SUM(ft.quantity)) > 0.0001 THEN 'OPEN'
      ELSE 'CLOSED' 
    END as position_status,
    
    -- Transaction metadata
    MIN(d.full_date) as first_transaction_date,
    MAX(d.full_date) as last_transaction_date,
    COUNT(*)::integer as transaction_count

  FROM "fact_transactions" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  JOIN "dim_date" d ON ft.date_key = d.date_key
  WHERE tt.action_category IN ('TRADE', 'CORPORATE')
  GROUP BY a.user_id, s.symbol, s.underlying_symbol, s.strike_price
);

-- Recreate view_portfolio_distribution that depends on view_positions
CREATE VIEW "public"."view_portfolio_distribution" AS (
  SELECT 
    user_id,
    underlying_symbol as company,
    SUM(cost_basis) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(cost_basis)) / SUM(ABS(SUM(cost_basis))) OVER (PARTITION BY user_id)) * 100 as portfolio_percentage
    
  FROM view_positions
  WHERE position_status = 'OPEN'
  GROUP BY user_id, underlying_symbol
  ORDER BY ABS(SUM(cost_basis)) DESC
);