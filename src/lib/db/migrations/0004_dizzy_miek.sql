DROP VIEW "public"."view_company_positions";--> statement-breakpoint
DROP VIEW "public"."view_positions";--> statement-breakpoint
CREATE VIEW "public"."position_calculations" AS (select "dim_account"."user_id", "fact_transactions"."security_key", "fact_transactions"."account_key", SUM(
        CASE WHEN "dim_transaction_type"."action_category" = 'TRADE' 
        THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
        ELSE 0 END
      ) as "net_quantity", SUM(
        CASE WHEN "dim_transaction_type"."action_category" = 'TRADE' 
        THEN "fact_transactions"."net_amount" * "dim_transaction_type"."direction"
        ELSE 0 END
      ) as "cost_basis", 
        SUM(
          CASE WHEN "dim_transaction_type"."action_category" = 'TRADE' AND ABS("fact_transactions"."quantity") > 0
          THEN ABS("fact_transactions"."quantity") * "fact_transactions"."price_per_unit"
          ELSE 0 END
        ) / NULLIF(SUM(
          CASE WHEN "dim_transaction_type"."action_category" = 'TRADE' AND ABS("fact_transactions"."quantity") > 0
          THEN ABS("fact_transactions"."quantity")
          ELSE 0 END
        ), 0)
       as "average_price", SUM(
        CASE WHEN "dim_transaction_type"."action_code" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign')
        THEN "fact_transactions"."net_amount"
        ELSE 0 END
      ) as "realized_pnl", SUM("fact_transactions"."fees") as "total_fees", MIN("dim_date"."full_date") as "first_transaction_date", MAX("dim_date"."full_date") as "last_transaction_date", MAX(
        CASE WHEN "dim_transaction_type"."action_code" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign')
        THEN "dim_date"."full_date" 
        END
      ) as "last_closing_date", COUNT(*) as "transaction_count", 
        CASE 
          WHEN SUM(
            CASE WHEN "dim_transaction_type"."action_category" = 'TRADE' 
            THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
            ELSE 0 END
          ) = 0 
          THEN MAX("dim_date"."full_date") - MIN("dim_date"."full_date")
          ELSE CURRENT_DATE - MIN("dim_date"."full_date")
        END
       as "days_held" from "fact_transactions" inner join "dim_account" on "fact_transactions"."account_key" = "dim_account"."account_key" inner join "dim_security" on "fact_transactions"."security_key" = "dim_security"."security_key" inner join "dim_transaction_type" on "fact_transactions"."transaction_type_key" = "dim_transaction_type"."transaction_type_key" inner join "dim_date" on "fact_transactions"."date_key" = "dim_date"."date_key" where "dim_transaction_type"."action_category" IN ('TRADE', 'CORPORATE_ACTION') group by "dim_account"."user_id", "fact_transactions"."security_key", "fact_transactions"."account_key");--> statement-breakpoint
CREATE VIEW "public"."view_positions" AS (
  SELECT 
    pc.user_id,
    ds.symbol,
    ds.security_type,
    ds.underlying_symbol,
    ds.option_type,
    ds.strike_price,
    ds.expiry_date,
    
    -- Use current positions data where available, fall back to calculated
    COALESCE(fcp.quantity_held, pc.net_quantity) as quantity_held,
    COALESCE(fcp.cost_basis, pc.cost_basis) as cost_basis,
    COALESCE(fcp.average_price, pc.average_price) as average_price,
    
    pc.realized_pnl as realised_pnl,
    pc.total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN ds.expiry_date IS NOT NULL 
      THEN (ds.expiry_date - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position direction based on current quantity
    CASE 
      WHEN COALESCE(fcp.quantity_held, pc.net_quantity) > 0.001 THEN 'LONG' 
      WHEN COALESCE(fcp.quantity_held, pc.net_quantity) < -0.001 THEN 'SHORT'
      ELSE 'CLOSED'
    END as direction,
    
    -- Position status
    CASE 
      WHEN ABS(COALESCE(fcp.quantity_held, pc.net_quantity)) > 0.001 THEN 'OPEN'
      ELSE 'CLOSED'
    END as position_status,
    
    pc.first_transaction_date,
    pc.last_transaction_date,
    pc.last_closing_date,
    pc.transaction_count,
    pc.days_held
    
  FROM position_calculations pc
  JOIN dim_security ds ON pc.security_key = ds.security_key
  LEFT JOIN fact_current_positions fcp ON pc.account_key = fcp.account_key 
    AND pc.security_key = fcp.security_key
  
  ORDER BY 
    CASE WHEN ABS(COALESCE(fcp.quantity_held, pc.net_quantity)) > 0.001 THEN 0 ELSE 1 END,  -- Open positions first
    ABS(COALESCE(fcp.cost_basis, pc.cost_basis)) DESC  -- Then by position size
);