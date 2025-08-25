
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
          'realizedPnl', CASE 
            WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "amount"::numeric - "fees"::numeric
            ELSE 0
          END,
          'unrealizedPnl', CASE 
            WHEN "action" IN ('buy_to_open', 'sell_to_open') THEN "amount"::numeric - "fees"::numeric
            ELSE 0
          END,
          'optionType', "option_type",
          'costBasis', CASE 
            WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
            ELSE "amount"::numeric
          END
        ) ORDER BY "date"
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");