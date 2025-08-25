DROP VIEW "public"."closed_positions" CASCADE;--> statement-breakpoint
DROP VIEW "public"."current_positions" CASCADE;--> statement-breakpoint
DROP VIEW "public"."open_positions" CASCADE;--> statement-breakpoint
CREATE VIEW "public"."position_calculations" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", SUM("quantity"::numeric) as "net_quantity", CASE 
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
      END) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX(CASE WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "date" END) as "closed_at", MAX("date") as "last_transaction_at", CASE 
        WHEN SUM("quantity"::numeric) = 0 THEN MAX("date") - MIN("date")
        ELSE CURRENT_DATE - MIN("date")
      END as "days_held", false as "is_expiring_soon", CASE 
        WHEN "option_type" IS NOT NULL THEN 'OPTION'
        ELSE 'EQUITY'
      END as "position_type" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");--> statement-breakpoint
CREATE VIEW "public"."transaction_details" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", JSON_AGG(
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
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");--> statement-breakpoint
CREATE VIEW "public"."closed_positions" AS (
  SELECT 
    p.user_id,
    p.ticker,
    p.option_type,
    p.strike_price,
    p.position_key,
    0 as net_quantity, -- Always 0 for closed positions
    CASE 
      WHEN p.option_type = 'PUT' THEN 'Put Trade'
      WHEN p.option_type = 'CALL' THEN 'Call Trade' 
      WHEN p.option_type IS NULL THEN 'Stock Trade'
      ELSE 'Unknown'
    END as strategy,
    p.cost_basis,
    p.total_pnl as realized_pnl, -- All P&L is realized for closed positions
    p.total_pnl,
    p.total_fees,
    p.opened_at,
    p.closed_at,
    p.last_transaction_at,
    p.days_held,
    'false' as is_expiring_soon,
    t.transaction_details
  FROM position_calculations p
  INNER JOIN transaction_details t ON 
    p.user_id = t.user_id AND
    p.ticker = t.ticker AND
    COALESCE(p.option_type, '') = COALESCE(t.option_type, '') AND
    COALESCE(p.strike_price, 0) = COALESCE(t.strike_price, 0)
  WHERE p.net_quantity::numeric = 0
);--> statement-breakpoint
CREATE VIEW "public"."current_positions" AS (select "user_id", "ticker", "option_type", "strike_price", "net_quantity", "cost_basis", "last_transaction_at", "position_type" from "position_calculations" where "net_quantity"::numeric != 0);--> statement-breakpoint
CREATE VIEW "public"."open_positions" AS (
  SELECT 
    p.user_id,
    p.ticker,
    p.option_type,
    p.strike_price,
    p.position_key,
    p.net_quantity,
    p.strategy,
    p.cost_basis,
    p.realized_pnl,
    p.total_pnl,
    p.total_fees,
    p.opened_at,
    p.last_transaction_at,
    p.days_held,
    p.is_expiring_soon,
    t.transaction_details
  FROM position_calculations p
  INNER JOIN transaction_details t ON 
    p.user_id = t.user_id AND
    p.ticker = t.ticker AND
    COALESCE(p.option_type, '') = COALESCE(t.option_type, '') AND
    COALESCE(p.strike_price, 0) = COALESCE(t.strike_price, 0)
  WHERE p.net_quantity::numeric != 0
);--> statement-breakpoint
CREATE VIEW "public"."portfolio_distribution" AS (select "user_id", "ticker", "position_type", CASE 
        WHEN "position_type" = 'OPTION' AND "strike_price" IS NOT NULL 
        THEN ABS("net_quantity"::numeric * 100 * "strike_price"::numeric)
        ELSE ABS("cost_basis")
      END as "position_value", "net_quantity", (CURRENT_DATE - "last_transaction_at") as "days_held" from "position_calculations" where "net_quantity"::numeric != 0 order by CASE 
      WHEN "position_type" = 'OPTION' AND "position_calculations"."strike_price" IS NOT NULL 
      THEN ABS("net_quantity"::numeric * 100 * "position_calculations"."strike_price"::numeric)
      ELSE ABS("cost_basis")
    END DESC);