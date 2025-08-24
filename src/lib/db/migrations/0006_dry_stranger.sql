ALTER TYPE "public"."transaction_action" ADD VALUE 'expire' BEFORE 'dividend';--> statement-breakpoint
ALTER TYPE "public"."transaction_action" ADD VALUE 'assign' BEFORE 'dividend';--> statement-breakpoint

CREATE OR REPLACE VIEW "public"."account_value_over_time" AS (
  WITH weekly_data AS (
    SELECT 
      user_id,
      DATE_TRUNC('week', date)::date as week_start,
      -- Weekly transfers (money wire in/out)
      SUM(CASE WHEN action = 'transfer' THEN amount::numeric ELSE 0 END) as weekly_transfers,
      -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
      SUM(CASE 
        WHEN action != 'transfer' THEN amount::numeric - fees::numeric
        ELSE 0
      END) as weekly_gains
    FROM transactions
    WHERE action != 'other'
    GROUP BY user_id, DATE_TRUNC('week', date)
  )
  SELECT 
    user_id,
    week_start,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_transfers,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) + 
    SUM(weekly_gains) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_portfolio_value
  FROM weekly_data
  ORDER BY user_id, week_start
);
CREATE OR REPLACE VIEW "public"."current_positions" AS (select "user_id", "ticker", "option_type", "strike_price", "expiry_date", SUM("quantity"::numeric) as "net_quantity", SUM(CASE 
        WHEN "option_type" IS NOT NULL THEN "strike_price"::numeric * 100 * "quantity"::numeric
        ELSE "amount"::numeric
      END) as "cost_basis", MAX("date") as "last_transaction_date", CASE 
        WHEN "option_type" IS NOT NULL THEN 'OPTION'
        ELSE 'EQUITY'
      END as "position_type" from "transactions" where "transactions"."action" NOT IN ('dividend', 'interest', 'transfer', 'other') group by "transactions"."user_id", "transactions"."ticker", "transactions"."option_type", "transactions"."strike_price", "transactions"."expiry_date" having SUM("transactions"."quantity"::numeric) != 0);
CREATE OR REPLACE VIEW "public"."portfolio_summary" AS (
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
CREATE OR REPLACE VIEW "public"."weekly_performance" AS (select "user_id", DATE_TRUNC('week', "date")::date as "week_start", SUM("amount"::numeric) - SUM("fees"::numeric) as "weekly_pnl", COUNT(*) as "transaction_count" from "transactions" where "transactions"."action" NOT IN ('transfer', 'other') group by "transactions"."user_id", DATE_TRUNC('week', "transactions"."date") order by "transactions"."user_id", week_start DESC);