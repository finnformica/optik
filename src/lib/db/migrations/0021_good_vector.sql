DROP VIEW IF EXISTS "public"."positions_by_symbol";
DROP VIEW IF EXISTS "public"."current_positions_compat";
DROP VIEW IF EXISTS "public"."portfolio_distribution";
DROP VIEW IF EXISTS "public"."portfolio_summary";
DROP VIEW IF EXISTS "public"."positions";
DROP VIEW IF EXISTS "public"."position_calculations";

CREATE OR REPLACE VIEW "public"."position_calculations" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", SUM("quantity"::numeric) as "net_quantity", ABS(SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END)) as "cost_basis", SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "amount"::numeric - "fees"::numeric
        ELSE 0
      END) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX(CASE WHEN "action" IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN "date" END) as "closed_at", MAX("date") as "last_transaction_at", CASE 
        WHEN SUM("quantity"::numeric) = 0 THEN MAX("date") - MIN("date")
        ELSE CURRENT_DATE - MIN("date")
      END as "days_held", false as "is_expiring_soon", SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN 0
        ELSE "amount"::numeric - "fees"::numeric
      END) as "unrealized_pnl" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price");--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."positions" AS (
  SELECT 
    p.user_id,
    p.ticker,
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
    p.ticker = t.ticker AND
    COALESCE(p.option_type, '') = COALESCE(t.option_type, '') AND
    COALESCE(p.strike_price, 0) = COALESCE(t.strike_price, 0)
);--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."positions_by_symbol" AS (
  SELECT 
    user_id,
    ticker,
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
);--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."current_positions_compat" AS (
  SELECT 
    p.user_id as user_id,
    p.ticker as ticker,
    p.option_type as option_type,
    p.strike_price as strike_price,
    p.net_quantity as net_quantity,
    p.cost_basis as cost_basis,
    p.last_transaction_at as last_transaction_date,
    CASE WHEN p.option_type IS NOT NULL THEN 'OPTION' ELSE 'EQUITY' END as position_type
  FROM positions p
  WHERE p.is_open = 'true'
);--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."portfolio_distribution" AS (
  SELECT 
    p.user_id as user_id,
    p.ticker as ticker,
    CASE 
      WHEN p.strike_price IS NOT NULL 
      THEN ABS(p.net_quantity::numeric * 100 * p.strike_price::numeric)
      ELSE ABS(p.cost_basis)
    END as position_value,
    p.net_quantity as net_quantity,
    (CURRENT_DATE - p.last_transaction_at) as days_held
  FROM positions p
  WHERE p.is_open = 'true'
  ORDER BY CASE 
    WHEN p.strike_price IS NOT NULL 
    THEN ABS(p.net_quantity::numeric * 100 * p.strike_price::numeric)
    ELSE ABS(p.cost_basis)
  END DESC
);--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."portfolio_summary" AS (
  WITH portfolio_totals AS (
    SELECT 
      user_id,
      SUM(amount::numeric) - SUM(fees::numeric) as portfolio_value,
      SUM(CASE WHEN action = 'transfer' THEN amount::numeric ELSE 0 END) as total_transfers,
      SUM(CASE WHEN action IN ('dividend', 'interest') THEN amount::numeric ELSE 0 END) as total_income,
      SUM(fees::numeric) as total_fees,
      COUNT(DISTINCT ticker) as unique_tickers,
      COUNT(*) as total_transactions,
      MIN(date) as first_transaction_date,
      MAX(date) as last_transaction_date
    FROM transactions
    WHERE action != 'other'
    GROUP BY user_id
  ),
  monthly_pnl AS (
    SELECT 
      user_id,
      SUM(amount::numeric) - SUM(fees::numeric) as monthly_pnl
    FROM transactions
    WHERE action NOT IN ('transfer', 'other') 
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id
  ),
  yearly_pnl AS (
    SELECT 
      user_id,
      SUM(amount::numeric) - SUM(fees::numeric) as yearly_pnl
    FROM transactions
    WHERE action NOT IN ('transfer', 'other')
      AND date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY user_id
  ),
  position_values AS (
    SELECT 
      user_id,
      COALESCE(SUM(cost_basis::numeric), 0) as total_position_cost
    FROM positions
    WHERE is_open = 'true'
    GROUP BY user_id
  ),
  weekly_pnl AS (
    SELECT 
      user_id,
      SUM(amount::numeric) - SUM(fees::numeric) as weekly_pnl
    FROM transactions
    WHERE action NOT IN ('transfer', 'other') 
      AND date >= DATE_TRUNC('week', CURRENT_DATE)
    GROUP BY user_id
  )
  SELECT 
    pt.user_id,
    pt.portfolio_value::text,
    (pt.portfolio_value - COALESCE(pv.total_position_cost, 0))::text as cash_balance,
    COALESCE(mp.monthly_pnl, 0)::text as monthly_pnl,
    COALESCE(yp.yearly_pnl, 0)::text as yearly_pnl,
    COALESCE(wp.weekly_pnl, 0)::text as weekly_pnl_amount,
    CASE 
      WHEN pt.portfolio_value > 0 AND mp.monthly_pnl IS NOT NULL
      THEN ((mp.monthly_pnl / pt.portfolio_value) * 100)::text
      ELSE '0'
    END as monthly_pnl_percent,
    CASE 
      WHEN pt.portfolio_value > 0 AND yp.yearly_pnl IS NOT NULL
      THEN ((yp.yearly_pnl / pt.portfolio_value) * 100)::text
      ELSE '0'
    END as yearly_pnl_percent,
    pt.total_income::text,
    pt.total_fees::text,
    pt.unique_tickers::text,
    pt.total_transactions::text,
    pt.first_transaction_date::text,
    pt.last_transaction_date::text
  FROM portfolio_totals pt
  LEFT JOIN monthly_pnl mp ON pt.user_id = mp.user_id
  LEFT JOIN yearly_pnl yp ON pt.user_id = yp.user_id
  LEFT JOIN position_values pv ON pt.user_id = pv.user_id
  LEFT JOIN weekly_pnl wp ON pt.user_id = wp.user_id
);