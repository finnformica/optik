CREATE OR REPLACE VIEW "public"."position_calculations" AS (select "dim_account"."user_id", "dim_security"."underlying_symbol", "dim_security"."option_type", "dim_security"."strike_price", CONCAT("dim_security"."underlying_symbol", '-', COALESCE("dim_security"."option_type", 'STOCK'), '-', COALESCE("dim_security"."strike_price"::text, '0')) as "position_key", SUM(
        CASE WHEN "dim_transaction_type"."affects_position" = true
        THEN "fact_transactions"."quantity"
        ELSE 0 END
      ) as "net_quantity", ABS(SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN "dim_security"."strike_price"::numeric * 100 * (
          CASE WHEN "dim_transaction_type"."affects_position" = true
          THEN "fact_transactions"."quantity"
          ELSE 0 END
        )
        ELSE "fact_transactions"."net_amount"::numeric
      END)) as "cost_basis", SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN "fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric
        ELSE 0
      END) as "realized_pnl", SUM("fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric) as "total_pnl", SUM("fact_transactions"."fees"::numeric) as "total_fees", MIN("dim_date"."full_date") as "opened_at", MAX(CASE WHEN "dim_transaction_type"."action_code" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "dim_date"."full_date" END) as "closed_at", MAX("dim_date"."full_date") as "last_transaction_at", CASE 
        WHEN SUM(
          CASE WHEN "dim_transaction_type"."action_category" = 'TRADE'
          THEN "fact_transactions"."quantity"
          ELSE 0 END
        ) = 0 THEN MAX("dim_date"."full_date") - MIN("dim_date"."full_date")
        ELSE CURRENT_DATE - MIN("dim_date"."full_date")
      END as "days_held", CASE 
        WHEN MAX("dim_security"."expiry_date") IS NOT NULL 
        AND MAX("dim_security"."expiry_date") <= CURRENT_DATE + INTERVAL '7 days'
        THEN true 
        ELSE false 
      END as "is_expiring_soon", SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN 0
        ELSE "fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric
      END) as "unrealized_pnl" from "fact_transactions" inner join "dim_account" on "fact_transactions"."account_key" = "dim_account"."account_key" inner join "dim_security" on "fact_transactions"."security_key" = "dim_security"."security_key" inner join "dim_transaction_type" on "fact_transactions"."transaction_type_key" = "dim_transaction_type"."transaction_type_key" inner join "dim_date" on "fact_transactions"."date_key" = "dim_date"."date_key" where "dim_transaction_type"."action_code" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "dim_account"."user_id", "dim_security"."underlying_symbol", "dim_security"."option_type", "dim_security"."strike_price");