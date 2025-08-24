CREATE OR REPLACE VIEW "public"."current_positions" AS (select "user_id", "ticker", "option_type", "strike_price", "expiry_date", SUM("quantity"::numeric) as "net_quantity", SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END) as "cost_basis", MAX("date") as "last_transaction_date", CASE 
        WHEN "option_type" IS NOT NULL THEN 'OPTION'
        ELSE 'EQUITY'
      END as "position_type", CASE 
        WHEN "expiry_date" IS NULL THEN NULL
        WHEN "expiry_date" < CURRENT_DATE THEN "expiry_date"::text || ' (EXPIRED)'
        ELSE "expiry_date"::text || ' (' || ("expiry_date" - CURRENT_DATE) || 'd)'
      END as "expiry_display" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price", "transactions"."expiry_date" having SUM("transactions"."quantity"::numeric) != 0);