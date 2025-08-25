CREATE VIEW "public"."closed_positions" AS (select "user_id", "ticker", "option_type", "strike_price", "expiry_date", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0'), '-', COALESCE("expiry_date"::text, '')) as "position_key", 0 as "net_quantity", CASE 
        WHEN "option_type" = 'PUT' THEN 'Put Trade'
        WHEN "option_type" = 'CALL' THEN 'Call Trade'
        WHEN "option_type" IS NULL THEN 'Stock Trade'
        ELSE 'Unknown'
      END as "strategy", ABS(SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END)) as "cost_basis", SUM("amount"::numeric - "fees"::numeric) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX("date") as "closed_at", MAX("date") as "last_transaction_at", MAX("date") - MIN("date") as "days_held", CASE 
        WHEN "expiry_date" IS NULL THEN NULL
        ELSE "expiry_date" - MAX("date")
      END as "days_to_expiry", false as "is_expiring_soon", JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', "id",
          'date', "date",
          'action', "action",
          'quantity', "quantity",
          'amount', "amount",
          'fees', "fees",
          'description', "description",
          'unitPrice', ABS("amount"::numeric / "quantity"::numeric),
          'creditDebitType', CASE WHEN "amount"::numeric > 0 THEN 'CR' ELSE 'DB' END,
          'displayAction', CASE 
            WHEN "action" IN ('buy', 'buy_to_open', 'buy_to_close') THEN 'BUY'
            ELSE 'SELL'
          END,
          'positionEffect', CASE 
            WHEN "action" IN ('buy_to_open', 'sell_to_open') THEN 'OPENING'
            WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN 'CLOSING'
            ELSE 'OTHER'
          END,
          'priceDisplay', CONCAT(
            ABS("amount"::numeric / "quantity"::numeric)::text, 
            ' ', 
            CASE WHEN "amount"::numeric > 0 THEN 'CR' ELSE 'DB' END
          ),
          'transactionPnl', "amount"::numeric - "fees"::numeric
        ) ORDER BY "date"
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price", "transactions"."expiry_date" having SUM("transactions"."quantity"::numeric) = 0);--> statement-breakpoint
CREATE VIEW "public"."open_positions" AS (select "user_id", "ticker", "option_type", "strike_price", "expiry_date", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0'), '-', COALESCE("expiry_date"::text, '')) as "position_key", SUM("quantity"::numeric) as "net_quantity", CASE 
        WHEN "option_type" = 'PUT' AND SUM("quantity"::numeric) < 0 THEN 'Short Put'
        WHEN "option_type" = 'PUT' AND SUM("quantity"::numeric) > 0 THEN 'Long Put'
        WHEN "option_type" = 'CALL' AND SUM("quantity"::numeric) < 0 THEN 'Short Call'
        WHEN "option_type" = 'CALL' AND SUM("quantity"::numeric) > 0 THEN 'Long Call'
        WHEN "option_type" IS NULL AND SUM("quantity"::numeric) > 0 THEN 'Long Stock'
        WHEN "option_type" IS NULL AND SUM("quantity"::numeric) < 0 THEN 'Short Stock'
        ELSE 'Unknown'
      END as "strategy", ABS(SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END)) as "cost_basis", SUM(CASE 
        WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "amount"::numeric - "fees"::numeric
        ELSE 0
      END) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX("date") as "last_transaction_at", CURRENT_DATE - MIN("date") as "days_held", CASE 
        WHEN "expiry_date" IS NULL THEN NULL
        ELSE "expiry_date" - CURRENT_DATE
      END as "days_to_expiry", CASE 
        WHEN "expiry_date" IS NOT NULL AND "expiry_date" - CURRENT_DATE <= 7 THEN true
        ELSE false
      END as "is_expiring_soon", JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', "id",
          'date', "date",
          'action', "action",
          'quantity', "quantity",
          'amount', "amount",
          'fees', "fees",
          'description', "description",
          'unitPrice', ABS("amount"::numeric / "quantity"::numeric),
          'creditDebitType', CASE WHEN "amount"::numeric > 0 THEN 'CR' ELSE 'DB' END,
          'displayAction', CASE 
            WHEN "action" IN ('buy', 'buy_to_open', 'buy_to_close') THEN 'BUY'
            ELSE 'SELL'
          END,
          'positionEffect', CASE 
            WHEN "action" IN ('buy_to_open', 'sell_to_open') THEN 'OPENING'
            WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN 'CLOSING'
            ELSE 'OTHER'
          END,
          'priceDisplay', CONCAT(
            ABS("amount"::numeric / "quantity"::numeric)::text, 
            ' ', 
            CASE WHEN "amount"::numeric > 0 THEN 'CR' ELSE 'DB' END
          ),
          'transactionPnl', "amount"::numeric - "fees"::numeric
        ) ORDER BY "date"
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price", "transactions"."expiry_date" having SUM("transactions"."quantity"::numeric) != 0);--> statement-breakpoint
CREATE VIEW "public"."positions_by_symbol" AS (
  WITH position_aggregates AS (
    -- Get open positions with aggregations
    SELECT 
      user_id,
      ticker,
      'OPEN' as position_type,
      COUNT(*) as total_positions,
      SUM(total_pnl::numeric) as total_pnl,
      SUM(total_fees::numeric) as total_fees,
      SUM(CASE WHEN is_expiring_soon = true THEN 1 ELSE 0 END) as expiring_soon_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'positionKey', position_key,
          'ticker', ticker,
          'optionType', option_type,
          'strikePrice', strike_price,
          'expiryDate', expiry_date,
          'strategy', strategy,
          'netQuantity', net_quantity,
          'totalPnl', total_pnl,
          'realizedPnl', realized_pnl,
          'costBasis', cost_basis,
          'totalFees', total_fees,
          'openedAt', opened_at,
          'lastTransactionAt', last_transaction_at,
          'daysHeld', days_held,
          'daysToExpiry', days_to_expiry,
          'isExpiringSoon', is_expiring_soon,
          'transactions', transaction_details
        ) ORDER BY opened_at DESC
      ) as positions_data
    FROM open_positions
    GROUP BY user_id, ticker
    
    UNION ALL
    
    -- Get closed positions with aggregations
    SELECT 
      user_id,
      ticker,
      'CLOSED' as position_type,
      COUNT(*) as total_positions,
      SUM(total_pnl::numeric) as total_pnl,
      SUM(total_fees::numeric) as total_fees,
      0 as expiring_soon_count,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'positionKey', position_key,
          'ticker', ticker,
          'optionType', option_type,
          'strikePrice', strike_price,
          'expiryDate', expiry_date,
          'strategy', strategy,
          'netQuantity', net_quantity,
          'totalPnl', total_pnl,
          'realizedPnl', realized_pnl,
          'costBasis', cost_basis,
          'totalFees', total_fees,
          'openedAt', opened_at,
          'closedAt', closed_at,
          'lastTransactionAt', last_transaction_at,
          'daysHeld', days_held,
          'daysToExpiry', days_to_expiry,
          'isExpiringSoon', is_expiring_soon,
          'transactions', transaction_details
        ) ORDER BY closed_at DESC
      ) as positions_data
    FROM closed_positions
    GROUP BY user_id, ticker
  )
  SELECT 
    user_id,
    ticker,
    position_type,
    total_positions::text,
    total_pnl::text,
    total_fees::text,
    expiring_soon_count::text,
    positions_data::text
  FROM position_aggregates
  ORDER BY user_id, total_pnl DESC, ticker
);