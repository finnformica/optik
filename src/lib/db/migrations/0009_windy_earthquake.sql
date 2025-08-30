DROP VIEW "public"."position_calculations" CASCADE;--> statement-breakpoint
DROP VIEW "public"."transaction_details";--> statement-breakpoint

CREATE VIEW "public"."position_calculations" AS (
  select 
    "dim_account"."user_id",
    "dim_security"."underlying_symbol", 
    "dim_security"."option_type", 
    "dim_security"."strike_price", 
    CONCAT(
      "dim_security"."underlying_symbol", '-', COALESCE("dim_security"."option_type", 'STOCK'), '-', COALESCE("dim_security"."strike_price"::text, '0')) as "position_key", 
    SUM(
        CASE WHEN "dim_transaction_type"."action_category" = 'TRADE'
        THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
        ELSE 0 END
    ) as "net_quantity", 
    ABS(SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN "dim_security"."strike_price"::numeric * 100 * (
          CASE WHEN "dim_transaction_type"."action_category" = 'TRADE'
          THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
          ELSE 0 END
        )
        ELSE "fact_transactions"."net_amount"::numeric
    END)) as "cost_basis", 
    SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN "fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric
        ELSE 0
      END) as "realized_pnl", 
    SUM("fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric) as "total_pnl", 
    SUM("fact_transactions"."fees"::numeric) as "total_fees", 
    MIN("dim_date"."full_date") as "opened_at", 
    MAX(CASE WHEN "dim_transaction_type"."action_code" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "dim_date"."full_date" END) as "closed_at", 
    MAX("dim_date"."full_date") as "last_transaction_at", 
    CASE 
        WHEN SUM(
          CASE WHEN "dim_transaction_type"."action_category" = 'TRADE'
          THEN "fact_transactions"."quantity" * "dim_transaction_type"."direction"
          ELSE 0 END
        ) = 0 THEN MAX("dim_date"."full_date") - MIN("dim_date"."full_date")
        ELSE CURRENT_DATE - MIN("dim_date"."full_date")
    END as "days_held", 
    CASE 
        WHEN "dim_security"."expiry_date" IS NOT NULL AND "dim_security"."expiry_date" <= CURRENT_DATE + INTERVAL '7 days' 
        THEN true 
        ELSE false 
    END as "is_expiring_soon", 
    SUM(CASE 
        WHEN "dim_security"."option_type" IS NOT NULL THEN 0
        ELSE "fact_transactions"."net_amount"::numeric - "fact_transactions"."fees"::numeric
    END) as "unrealized_pnl"
    from "fact_transactions" 
    inner join "dim_account" 
      on "fact_transactions"."account_key" = "dim_account"."account_key" 
    inner join "dim_security" 
      on "fact_transactions"."security_key" = "dim_security"."security_key" 
    inner join "dim_transaction_type" 
      on "fact_transactions"."transaction_type_key" = "dim_transaction_type"."transaction_type_key" 
    inner join "dim_date" 
      on "fact_transactions"."date_key" = "dim_date"."date_key" 
    where "dim_transaction_type"."action_code" NOT IN ('dividend', 'interest', 'transfer', 'other') 
    group by "dim_account"."user_id", "dim_security"."underlying_symbol", "dim_security"."option_type", "dim_security"."strike_price", "dim_security"."expiry_date");--> statement-breakpoint

CREATE VIEW "public"."transaction_details" AS (select "dim_account"."user_id", "dim_security"."underlying_symbol", "dim_security"."option_type", "dim_security"."strike_price", JSON_AGG(
        JSON_BUILD_OBJECT(
          'date', "dim_date"."full_date",
          'action', "dim_transaction_type"."action_code",
          'quantity', "fact_transactions"."quantity",
          'pricePerUnit', "fact_transactions"."price_per_unit",
          'amount', "fact_transactions"."net_amount",
          'fees', "fact_transactions"."fees",
          'brokerTransactionId', "fact_transactions"."broker_transaction_id",
          'underlyingSymbol', "dim_security"."underlying_symbol"
        ) ORDER BY "dim_date"."full_date" DESC
      ) as "transaction_details" from "fact_transactions" inner join "dim_account" on "fact_transactions"."account_key" = "dim_account"."account_key" inner join "dim_security" on "fact_transactions"."security_key" = "dim_security"."security_key" inner join "dim_transaction_type" on "fact_transactions"."transaction_type_key" = "dim_transaction_type"."transaction_type_key" inner join "dim_date" on "fact_transactions"."date_key" = "dim_date"."date_key" where "dim_transaction_type"."action_code" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "dim_account"."user_id", "dim_security"."underlying_symbol", "dim_security"."option_type", "dim_security"."strike_price");--> statement-breakpoint

CREATE VIEW "public"."view_positions" AS (
  SELECT 
    p.user_id,
    p.underlying_symbol,
    p.option_type,
    p.strike_price,
    p.position_key,
    p.net_quantity,
    p.cost_basis,
    p.realized_pnl,
    p.unrealized_pnl,
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
    p.underlying_symbol = t.underlying_symbol AND
    COALESCE(p.option_type, '') = COALESCE(t.option_type, '') AND
    COALESCE(p.strike_price, 0) = COALESCE(t.strike_price, 0)
);

CREATE VIEW "public"."positions_by_symbol" AS (
  SELECT 
    user_id,
    underlying_symbol as symbol,
    CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END as position_type,
    COUNT(*)::text as total_positions,
    SUM(total_pnl::numeric)::text as total_pnl,
    SUM(realized_pnl::numeric)::text as realized_pnl,
    SUM(unrealized_pnl::numeric)::text as unrealized_pnl,
    SUM(total_fees::numeric)::text as total_fees,
    SUM(CASE WHEN is_expiring_soon::boolean = true THEN 1 ELSE 0 END)::text as expiring_soon_count,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'positionKey', position_key,
        'underlyingSymbol', underlying_symbol,
        'optionType', option_type,
        'strikePrice', strike_price,
        'netQuantity', net_quantity,
        'totalPnl', total_pnl,
        'realizedPnl', realized_pnl,
        'unrealizedPnl', unrealized_pnl,
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
  FROM view_positions
  GROUP BY user_id, symbol, CASE WHEN is_open = 'true' THEN 'OPEN' ELSE 'CLOSED' END
  ORDER BY user_id, SUM(total_pnl::numeric) DESC, symbol
);--> statement-breakpoint