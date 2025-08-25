-- Drop dependent views first
DROP VIEW IF EXISTS "public"."portfolio_distribution";
DROP VIEW IF EXISTS "public"."portfolio_summary";
DROP VIEW IF EXISTS "public"."positions_by_symbol";
DROP VIEW IF EXISTS "public"."closed_positions";
DROP VIEW IF EXISTS "public"."open_positions";
DROP VIEW IF EXISTS "public"."current_positions";
CREATE VIEW "public"."closed_positions" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", 0 as "net_quantity", CASE 
        WHEN "option_type" = 'PUT' THEN 'Put Trade'
        WHEN "option_type" = 'CALL' THEN 'Call Trade'
        WHEN "option_type" IS NULL THEN 'Stock Trade'
        ELSE 'Unknown'
      END as "strategy", ABS(SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END)) as "cost_basis", SUM("amount"::numeric - "fees"::numeric) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX("date") as "closed_at", MAX("date") as "last_transaction_at", MAX("date") - MIN("date") as "days_held", false as "is_expiring_soon", JSON_AGG(
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
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price" having SUM("transactions"."quantity"::numeric) = 0);--> statement-breakpoint
CREATE VIEW "public"."current_positions" AS (select "user_id", "ticker", "option_type", "strike_price", SUM("quantity"::numeric) as "net_quantity", SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END) as "cost_basis", MAX("date") as "last_transaction_date", CASE 
        WHEN "option_type" IS NOT NULL THEN 'OPTION'
        ELSE 'EQUITY'
      END as "position_type" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price" having SUM("transactions"."quantity"::numeric) != 0);--> statement-breakpoint
CREATE VIEW "public"."open_positions" AS (select "user_id", "ticker", "option_type", "strike_price", CONCAT("ticker", '-', COALESCE("option_type", 'STOCK'), '-', COALESCE("strike_price"::text, '0')) as "position_key", SUM("quantity"::numeric) as "net_quantity", CASE 
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
      END) as "realized_pnl", SUM("amount"::numeric - "fees"::numeric) as "total_pnl", SUM("fees"::numeric) as "total_fees", MIN("date") as "opened_at", MAX("date") as "last_transaction_at", CURRENT_DATE - MIN("date") as "days_held", false as "is_expiring_soon", JSON_AGG(
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
      ) as "transaction_details" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price" having SUM("transactions"."quantity"::numeric) != 0);--> statement-breakpoint
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
          'strategy', strategy,
          'netQuantity', net_quantity,
          'totalPnl', total_pnl,
          'realizedPnl', realized_pnl,
          'costBasis', cost_basis,
          'totalFees', total_fees,
          'openedAt', opened_at,
          'lastTransactionAt', last_transaction_at,
          'daysHeld', days_held,
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

-- Recreate dependent views
CREATE VIEW "public"."portfolio_summary" AS (
  WITH portfolio_totals AS (
    SELECT 
      user_id,
      -- Portfolio Value = Sum of all normalized amounts minus fees
      SUM(amount::numeric) - SUM(fees::numeric) as portfolio_value,
      -- Total transfers (money deposited/withdrawn)
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
      -- Sum of cost basis for all current open positions (actual money tied up in positions)
      COALESCE(SUM(cost_basis::numeric), 0) as total_position_cost
    FROM current_positions
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
    -- Cash Balance = Portfolio Value - Position Cost Basis (available cash)
    (pt.portfolio_value - COALESCE(pv.total_position_cost, 0))::text as cash_balance,
    COALESCE(mp.monthly_pnl, 0)::text as monthly_pnl,
    COALESCE(yp.yearly_pnl, 0)::text as yearly_pnl,
    -- Weekly P&L amount (absolute dollar change this week)
    COALESCE(wp.weekly_pnl, 0)::text as weekly_pnl_amount,
    -- Monthly P&L as percentage of portfolio
    CASE 
      WHEN pt.portfolio_value > 0 AND mp.monthly_pnl IS NOT NULL
      THEN ((mp.monthly_pnl / pt.portfolio_value) * 100)::text
      ELSE '0'
    END as monthly_pnl_percent,
    -- Yearly P&L as percentage of portfolio
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

CREATE VIEW "public"."portfolio_distribution" AS (
  SELECT 
    user_id as user_id,
    ticker as ticker,
    position_type as position_type,
    -- For options, use contract size (quantity * 100 * strike) or premium paid, for stocks use cost basis
    CASE 
      WHEN position_type = 'OPTION' AND strike_price IS NOT NULL 
      THEN ABS(net_quantity::numeric * 100 * strike_price::numeric)
      ELSE ABS(cost_basis)
    END as position_value,
    net_quantity as net_quantity,
    (CURRENT_DATE - last_transaction_date) as days_held
  FROM current_positions
  ORDER BY CASE 
    WHEN position_type = 'OPTION' AND strike_price IS NOT NULL 
    THEN ABS(net_quantity::numeric * 100 * strike_price::numeric)
    ELSE ABS(cost_basis)
  END DESC
);