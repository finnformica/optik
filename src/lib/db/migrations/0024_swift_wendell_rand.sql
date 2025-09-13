DROP VIEW "public"."view_portfolio_distribution";--> statement-breakpoint
DROP VIEW "public"."view_positions";--> statement-breakpoint
DROP VIEW "public"."view_weekly_returns";--> statement-breakpoint
ALTER TABLE "dim_account" DROP CONSTRAINT "unique_user_account";--> statement-breakpoint
ALTER TABLE "raw_transactions" DROP CONSTRAINT "raw_transactions_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_raw_transactions_user_status";--> statement-breakpoint
ALTER TABLE "raw_transactions" ADD COLUMN "account_key" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_transactions" ADD CONSTRAINT "raw_transactions_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_raw_transactions_account_status" ON "raw_transactions" USING btree ("account_key","status");--> statement-breakpoint
ALTER TABLE "raw_transactions" DROP COLUMN "user_id";--> statement-breakpoint
CREATE VIEW "public"."view_positions" AS (
  SELECT 
    a.account_key,
    s.symbol,
    s.underlying_symbol,
    MAX(s.security_type) as security_type,
    MAX(s.option_type) as option_type,
    s.strike_price,
    
    -- Core position metrics from transaction aggregation
    SUM(ft.quantity) as quantity_held,
    
    -- Position value: Market exposure/collateral requirement (no fees)
    -- TODO: Option position_value calculation needs refinement:
    -- - Short PUTs: Current logic (strike * 100) is correct for cash-secured puts
    -- - Short CALLs: Should distinguish between covered calls (share collateral) vs naked calls (margin requirement)
    -- - Current approach assumes all options use strike price collateral, which overestimates CALL requirements
    SUM(
      CASE 
        WHEN s.security_type = 'STOCK' THEN ABS(ft.gross_amount)
        WHEN s.security_type = 'OPTION' THEN ABS(ft.quantity) * s.strike_price * 100
        ELSE ABS(ft.gross_amount)
      END
    ) as position_value,
    
    -- Net position value: Same logic but includes fees
    SUM(
      CASE 
        WHEN s.security_type = 'STOCK' THEN ft.net_amount
        WHEN s.security_type = 'OPTION' THEN ABS(ft.quantity) * s.strike_price * 100 - ft.fees
        ELSE ft.net_amount
      END
    ) as net_position_value,
    SUM(ABS(ft.quantity * ft.price_per_unit)) / NULLIF(SUM(ABS(ft.quantity)), 0) as average_price,
    SUM(ft.fees) as total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN MAX(s.expiry_date) IS NOT NULL 
      THEN (MAX(s.expiry_date) - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position status
    CASE 
      -- Handle expired options
      WHEN MAX(s.security_type) = 'OPTION' AND MAX(s.expiry_date) < CURRENT_DATE THEN 'CLOSED'
      -- Different thresholds for different asset types
      WHEN MAX(s.security_type) = 'OPTION' AND ABS(SUM(ft.quantity)) > 0.001 THEN 'OPEN'
      WHEN MAX(s.security_type) = 'STOCK' AND ABS(SUM(ft.quantity)) > 0.0001 THEN 'OPEN'
      ELSE 'CLOSED' 
    END as position_status,
    
    -- Transaction metadata
    MIN(d.full_date) as first_transaction_date,
    MAX(d.full_date) as last_transaction_date,
    COUNT(*)::integer as transaction_count

  FROM "fact_transactions" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  JOIN "dim_date" d ON ft.date_key = d.date_key
  WHERE tt.action_category IN ('TRADE', 'CORPORATE')
  GROUP BY a.account_key, s.symbol, s.underlying_symbol, s.strike_price
);--> statement-breakpoint
CREATE VIEW "public"."view_weekly_returns" AS (
  WITH weekly_data AS (
      SELECT 
          a.account_key,
          d.week_ending_date as week_start,
          -- Weekly transfers (money wire in/out)
          SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
          -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
          SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
      FROM "fact_transactions" ft
      JOIN "dim_date" d ON ft.date_key = d.date_key
      JOIN "dim_account" a ON ft.account_key = a.account_key
      JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
      WHERE d.full_date <= CURRENT_DATE
      GROUP BY a.account_key, d.week_ending_date
  ),

  cumulative_data AS (
      SELECT 
          account_key,
          week_start,
          weekly_transfers,
          weekly_gains,
          -- Cumulative calculations
          SUM(weekly_transfers) OVER (PARTITION BY account_key ORDER BY week_start) as cumulative_transfers,
          SUM(weekly_transfers + weekly_gains) OVER (PARTITION BY account_key ORDER BY week_start) as cumulative_portfolio_value
      FROM weekly_data
  ),

  lagged_data AS (
      SELECT 
          account_key,
          week_start,
          weekly_gains,
          weekly_transfers,
          cumulative_portfolio_value,
          cumulative_transfers,
          -- LAG calculation for previous week's portfolio value
          LAG(cumulative_portfolio_value, 1) OVER (PARTITION BY account_key ORDER BY week_start) as prev_week_portfolio_value
      FROM cumulative_data
  ),

  returns_calculation AS (
      SELECT 
          account_key,
          week_start,
          weekly_transfers,
          cumulative_portfolio_value,
          cumulative_transfers,
          prev_week_portfolio_value,
          weekly_gains as weekly_return_absolute,
          -- Weekly return calculation: subtract transfers to avoid spikes
          CASE 
              WHEN prev_week_portfolio_value > 0 
              THEN ((cumulative_portfolio_value - weekly_transfers - prev_week_portfolio_value) 
                    / prev_week_portfolio_value) * 100
              ELSE NULL
          END as weekly_return_percent
      FROM lagged_data
      WHERE prev_week_portfolio_value IS NOT NULL
  )

  SELECT 
      account_key,
      week_start,
      cumulative_portfolio_value,
      cumulative_transfers,
      weekly_return_percent,
      weekly_return_absolute
  FROM returns_calculation
  ORDER BY account_key, week_start
);--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_distribution" AS (
  SELECT 
    account_key,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY account_key)) * 100 as portfolio_percentage
    
  FROM view_positions
  WHERE position_status = 'OPEN'
  GROUP BY account_key, underlying_symbol
  ORDER BY ABS(SUM(position_value)) DESC
);