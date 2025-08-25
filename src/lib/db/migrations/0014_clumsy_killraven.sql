DROP VIEW "public"."closed_positions" CASCADE;--> statement-breakpoint
DROP VIEW "public"."current_positions" CASCADE;--> statement-breakpoint
DROP VIEW "public"."open_positions" CASCADE;--> statement-breakpoint
DROP VIEW "public"."portfolio_distribution" CASCADE;--> statement-breakpoint
DROP VIEW "public"."position_calculations" CASCADE;--> statement-breakpoint
CREATE VIEW "public"."position_calculations" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", SUM("quantity"::numeric) as "net_quantity", ABS(SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END)) as "cost_basis", SUM(CASE 
        WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "amount"::numeric - "fees"::numeric
        ELSE 0
      END) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX(CASE WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "date" END) as "closed_at", MAX("date") as "last_transaction_at", CASE 
        WHEN SUM("quantity"::numeric) = 0 THEN MAX("date") - MIN("date")
        ELSE CURRENT_DATE - MIN("date")
      END as "days_held", false as "is_expiring_soon" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");--> statement-breakpoint

CREATE VIEW "public"."positions" AS (
  SELECT 
    p.user_id,
    p.ticker,
    p.option_type,
    p.strike_price,
    p.position_key,
    p.net_quantity,
    p.cost_basis,
    CASE 
      WHEN p.net_quantity::numeric = 0 THEN p.total_pnl -- All P&L is realized for closed positions
      ELSE p.realized_pnl
    END as realized_pnl,
    p.total_pnl,
    p.total_fees,
    p.opened_at,
    p.closed_at,
    p.last_transaction_at,
    p.days_held,
    p.is_expiring_soon,
    CASE WHEN p.net_quantity::numeric != 0 THEN 'true' ELSE 'false' END as is_open,
    t.transaction_details
  FROM position_calculations p
  INNER JOIN transaction_details t ON 
    p.user_id = t.user_id AND
    p.ticker = t.ticker AND
    COALESCE(p.option_type, '') = COALESCE(t.option_type, '') AND
    COALESCE(p.strike_price, 0) = COALESCE(t.strike_price, 0)
);--> statement-breakpoint
CREATE VIEW "public"."current_positions_compat" AS (select "user_id", "ticker", "option_type", "strike_price", "net_quantity", "cost_basis", "last_transaction_at", CASE WHEN "option_type" IS NOT NULL THEN 'OPTION' ELSE 'EQUITY' END as "position_type" from "positions" where "positions"."is_open" = 'true');--> statement-breakpoint
CREATE VIEW "public"."portfolio_distribution" AS (select "user_id", "ticker", CASE 
        WHEN "strike_price" IS NOT NULL 
        THEN ABS("net_quantity"::numeric * 100 * "strike_price"::numeric)
        ELSE ABS("cost_basis")
      END as "position_value", "net_quantity", (CURRENT_DATE - "last_transaction_at") as "days_held" from "positions" where "positions"."is_open" = 'true' order by CASE 
      WHEN "positions"."strike_price" IS NOT NULL 
      THEN ABS("positions"."net_quantity"::numeric * 100 * "positions"."strike_price"::numeric)
      ELSE ABS("positions"."cost_basis")
    END DESC);--> statement-breakpoint
CREATE VIEW "public"."positions_by_symbol" AS (
  SELECT 
    user_id,
    ticker,
    CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END as position_type,
    COUNT(*)::text as total_positions,
    SUM(total_pnl::numeric)::text as total_pnl,
    SUM(total_fees::numeric)::text as total_fees,
    SUM(CASE WHEN is_expiring_soon::boolean = true THEN 1 ELSE 0 END)::text as expiring_soon_count,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'positionKey', position_key,
        'ticker', ticker,
        'optionType', option_type,
        'strikePrice', strike_price,
        'netQuantity', net_quantity,
        'totalPnl', total_pnl,
        'realizedPnl', realized_pnl,
        'costBasis', cost_basis,
        'totalFees', total_fees,
        'openedAt', opened_at,
        'closedAt', closed_at,
        'lastTransactionAt', last_transaction_at,
        'daysHeld', days_held,
        'isExpiringSoon', is_expiring_soon,
        'transactions', transaction_details::json
      ) ORDER BY COALESCE(closed_at, last_transaction_at) DESC
    )::text as positions_data
  FROM positions
  GROUP BY user_id, ticker, CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END
  ORDER BY user_id, SUM(total_pnl::numeric) DESC, ticker
);