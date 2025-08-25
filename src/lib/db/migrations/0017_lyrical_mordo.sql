CREATE OR REPLACE VIEW "public"."transaction_details" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', "id",
          'date', "date",
          'action', "action",
          'quantity', "quantity",
          'amount', "amount",
          'fees', "fees",
          'description', "description",
          'unitPrice', CASE 
            WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric
            ELSE ABS("amount"::numeric / "quantity"::numeric)
          END,
          'creditDebitType', CASE WHEN "amount"::numeric > 0 THEN 'CR' ELSE 'DB' END,
          'transactionPnl', "amount"::numeric - "fees"::numeric,
          'optionType', "option_type"
        ) ORDER BY "date"
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");