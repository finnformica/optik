DROP VIEW "public"."position_calculations" CASCADE;--> statement-breakpoint
CREATE VIEW "public"."position_calculations" AS (select "dim_account"."user_id", "fact_transactions"."security_key", "fact_transactions"."account_key", SUM(
        CASE WHEN "dim_transaction_type"."affects_position" = true
        THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
        ELSE 0 END
      ) as "net_quantity", SUM(
        CASE WHEN "dim_transaction_type"."affects_position" = true
        THEN ABS("fact_transactions"."gross_amount")
        ELSE 0 END
      ) as "cost_basis", SUM(
        CASE WHEN "dim_transaction_type"."affects_position" = true AND "dim_transaction_type"."direction" = 1
        THEN "fact_transactions"."gross_amount"  -- Money coming in (sells)
        ELSE 0 END
      ) as "total_proceeds", 
        CASE WHEN ABS(SUM(
          CASE WHEN "dim_transaction_type"."affects_position" = true
          THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
          ELSE 0 END
        )) > 0.001
        THEN SUM(
          CASE WHEN "dim_transaction_type"."affects_position" = true
          THEN ABS("fact_transactions"."gross_amount")
          ELSE 0 END
        ) / ABS(SUM(
          CASE WHEN "dim_transaction_type"."affects_position" = true
          THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
          ELSE 0 END
        ))
        ELSE 0 END
       as "average_price", SUM(
        CASE WHEN "dim_transaction_type"."affects_position" = true
        THEN "fact_transactions"."net_amount" * "dim_transaction_type"."direction"
        ELSE 0 END
      ) as "realized_pnl", SUM(
        CASE WHEN "dim_transaction_type"."action_category" = 'INCOME'
        THEN "fact_transactions"."net_amount"
        ELSE 0 END
      ) as "income_received", SUM("fact_transactions"."fees") as "total_fees", MIN("dim_date"."full_date") as "first_transaction_date", MAX("dim_date"."full_date") as "last_transaction_date", COUNT(*) as "transaction_count", 
        CASE 
          WHEN SUM(
            CASE WHEN "dim_transaction_type"."affects_position" = true
            THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
            ELSE 0 END
          ) = 0 
          THEN (MAX("dim_date"."full_date") - MIN("dim_date"."full_date"))::integer
          ELSE (CURRENT_DATE - MIN("dim_date"."full_date"))::integer
        END
       as "days_held" from "fact_transactions" inner join "dim_account" on "fact_transactions"."account_key" = "dim_account"."account_key" inner join "dim_security" on "fact_transactions"."security_key" = "dim_security"."security_key" inner join "dim_transaction_type" on "fact_transactions"."transaction_type_key" = "dim_transaction_type"."transaction_type_key" inner join "dim_date" on "fact_transactions"."date_key" = "dim_date"."date_key" where "fact_transactions"."security_key" IS NOT NULL AND "dim_transaction_type"."affects_position" = true group by "dim_account"."user_id", "fact_transactions"."security_key", "fact_transactions"."account_key");--> statement-breakpoint
CREATE VIEW "public"."view_positions" AS (
  SELECT 
    pc.user_id,
    ds.symbol,
    ds.security_type,
    ds.underlying_symbol,
    ds.option_type,
    ds.strike_price,
    ds.expiry_date,
    
    -- Use calculated data only
    pc.net_quantity as quantity_held,
    pc.cost_basis,
    pc.average_price,
    pc.realized_pnl as realised_pnl,
    pc.total_proceeds,
    pc.income_received,
    pc.total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN ds.expiry_date IS NOT NULL 
      THEN (ds.expiry_date - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position direction based on net quantity
    CASE 
      WHEN pc.net_quantity > 0.001 THEN 'LONG' 
      WHEN pc.net_quantity < -0.001 THEN 'SHORT'
      ELSE 'CLOSED'
    END as direction,
    
    -- Position status (CLOSED if net quantity is zero)
    CASE 
      WHEN ABS(pc.net_quantity) > 0.001 THEN 'OPEN'
      ELSE 'CLOSED'
    END as position_status,
    
    pc.first_transaction_date,
    pc.last_transaction_date,
    pc.transaction_count,
    pc.days_held
    
  FROM position_calculations pc
  JOIN dim_security ds ON pc.security_key = ds.security_key
  
  ORDER BY 
    CASE WHEN ABS(pc.net_quantity) > 0.001 THEN 0 ELSE 1 END,  -- Open positions first
    ABS(pc.cost_basis) DESC  -- Then by position size
);