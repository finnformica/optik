CREATE OR REPLACE VIEW "public"."view_positions" AS (
  SELECT 
    a.user_id,
    s.symbol,
    s.underlying_symbol,
    s.security_name,
    s.security_type,
    s.option_type,
    s.strike_price,
    s.expiry_date,
    
    -- Core position metrics from transaction aggregation
    SUM(ft.quantity * tt.direction) as quantity_held,
    SUM(ft.net_amount * tt.direction) as cost_basis,
    SUM(ABS(ft.quantity * ft.price_per_unit)) / NULLIF(SUM(ABS(ft.quantity)), 0) as average_price,
    SUM(ft.fees) as total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN s.expiry_date IS NOT NULL 
      THEN (s.expiry_date - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position direction
    CASE 
      WHEN SUM(ft.quantity * tt.direction) > 0.001 THEN 'LONG'
      WHEN SUM(ft.quantity * tt.direction) < -0.001 THEN 'SHORT'
      ELSE 'CLOSED'
    END as direction,
    
    -- Position status
    CASE 
      WHEN ABS(SUM(ft.quantity * tt.direction)) > 0.001 THEN 'OPEN' 
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
  WHERE tt.action_category = 'TRADE'
  GROUP BY a.user_id, s.symbol, s.underlying_symbol, s.security_name,
           s.security_type, s.option_type, s.strike_price, s.expiry_date
);