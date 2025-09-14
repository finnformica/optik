CREATE OR REPLACE VIEW "public"."view_positions" AS (
  SELECT
    a.account_key,
    s.symbol,
    s.underlying_symbol,
    MAX(s.security_type) as security_type,
    MAX(s.option_type) as option_type,
    s.strike_price,
    
    -- Core position metrics from transaction aggregation
    SUM(ft.quantity) as quantity_held,
    
    -- Position value: Market exposure/collateral requirement (no fees)
    -- TODO: Option position_value calculation needs refinement:
    -- - Short PUTs: Current logic (strike * 100) is correct for cash-secured puts
    -- - Short CALLs: Should distinguish between covered calls (share collateral) vs naked calls (margin requirement)
    -- - Current approach assumes all options use strike price collateral, which overestimates CALL requirements
    SUM(
      CASE 
        WHEN s.security_type = 'STOCK' THEN ABS(ft.gross_amount)
        WHEN s.security_type = 'OPTION' THEN ABS(ft.quantity) * s.strike_price * 100
        ELSE ABS(ft.gross_amount)
      END
    ) as position_value,
    
    -- Net position value: Same logic but includes fees
    SUM(
      CASE 
        WHEN s.security_type = 'STOCK' THEN ft.net_amount
        WHEN s.security_type = 'OPTION' THEN ABS(ft.quantity) * s.strike_price * 100 - ft.fees
        ELSE ft.net_amount
      END
    ) as net_position_value,
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
      -- Different thresholds for different asset types
      WHEN MAX(s.security_type) = 'OPTION' AND ABS(SUM(ft.quantity)) > 0.001 THEN 'OPEN'
      WHEN MAX(s.security_type) = 'STOCK' AND ABS(SUM(ft.quantity)) > 0.0001 THEN 'OPEN'
      ELSE 'CLOSED' 
    END as position_status,
    
    -- Transaction metadata
    MIN(d.full_date) as first_transaction_date,
    MAX(d.full_date) as last_transaction_date,
    COUNT(*)::integer as transaction_count,

    -- Expiration date
    CASE
      WHEN MAX(s.expiry_date) IS NOT NULL 
      THEN MAX(s.expiry_date)
      ELSE NULL
    END as expiry_date

  FROM "fact_transactions" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  JOIN "dim_date" d ON ft.date_key = d.date_key
  WHERE tt.action_category IN ('TRADE', 'CORPORATE')
  GROUP BY a.account_key, s.symbol, s.underlying_symbol, s.strike_price
);