DROP VIEW "public"."view_portfolio_distribution";--> statement-breakpoint
DROP VIEW "public"."view_portfolio_summary";--> statement-breakpoint
ALTER VIEW "public"."view_positions" RENAME TO "view_position";--> statement-breakpoint
ALTER VIEW "public"."view_weekly_returns" RENAME TO "view_weekly_return";--> statement-breakpoint
ALTER TABLE "dim_account_access_tokens" RENAME TO "dim_account_access_token";--> statement-breakpoint
ALTER TABLE "dim_broker_accounts" RENAME TO "dim_broker_account";--> statement-breakpoint
ALTER TABLE "users" RENAME TO "dim_user";--> statement-breakpoint
ALTER TABLE "fact_transactions" RENAME TO "fact_transaction";--> statement-breakpoint
ALTER TABLE "raw_transactions" RENAME TO "stg_transaction";--> statement-breakpoint
ALTER TABLE "dim_user" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "dim_account" DROP CONSTRAINT "dim_account_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "dim_account_access_token" DROP CONSTRAINT "dim_account_access_tokens_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_account_access_token" DROP CONSTRAINT "dim_account_access_tokens_broker_code_dim_broker_broker_code_fk";
--> statement-breakpoint
ALTER TABLE "dim_broker_account" DROP CONSTRAINT "dim_broker_accounts_account_key_dim_account_account_key_fk";
--> statement-breakpoint
ALTER TABLE "dim_broker_account" DROP CONSTRAINT "dim_broker_accounts_broker_key_dim_broker_broker_key_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fact_transactions_date_key_dim_date_date_key_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fact_transactions_security_key_dim_security_security_key_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fact_transactions_transaction_type_key_dim_transaction_type_transaction_type_key_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fact_transactions_broker_key_dim_broker_broker_key_fk";
--> statement-breakpoint
ALTER TABLE "fact_transaction" DROP CONSTRAINT "fk_fact_transactions_security";
--> statement-breakpoint
ALTER TABLE "stg_transaction" DROP CONSTRAINT "raw_transactions_account_key_dim_account_account_key_fk";
--> statement-breakpoint
DROP INDEX "idx_broker_accounts_account_broker";--> statement-breakpoint
DROP INDEX "idx_broker_accounts_hash";--> statement-breakpoint
DROP INDEX "idx_fact_transactions_date";--> statement-breakpoint
DROP INDEX "idx_fact_transactions_account";--> statement-breakpoint
DROP INDEX "idx_fact_transactions_security";--> statement-breakpoint
DROP INDEX "idx_raw_transactions_account_status";--> statement-breakpoint
DROP INDEX "idx_raw_transactions_broker_id";--> statement-breakpoint
ALTER TABLE "dim_account" ADD CONSTRAINT "dim_account_user_id_dim_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."dim_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account_access_token" ADD CONSTRAINT "dim_account_access_token_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account_access_token" ADD CONSTRAINT "dim_account_access_token_broker_code_dim_broker_broker_code_fk" FOREIGN KEY ("broker_code") REFERENCES "public"."dim_broker"("broker_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_broker_account" ADD CONSTRAINT "dim_broker_account_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_broker_account" ADD CONSTRAINT "dim_broker_account_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_date_key_dim_date_date_key_fk" FOREIGN KEY ("date_key") REFERENCES "public"."dim_date"("date_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_security_key_dim_security_security_key_fk" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_transaction_type_key_dim_transaction_type_transaction_type_key_fk" FOREIGN KEY ("transaction_type_key") REFERENCES "public"."dim_transaction_type"("transaction_type_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fact_transaction_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transaction" ADD CONSTRAINT "fk_fact_transaction_security" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stg_transaction" ADD CONSTRAINT "stg_transaction_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_broker_account_account_broker" ON "dim_broker_account" USING btree ("account_key","broker_key");--> statement-breakpoint
CREATE INDEX "idx_broker_account_hash" ON "dim_broker_account" USING btree ("broker_account_hash");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_date" ON "fact_transaction" USING btree ("date_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_account" ON "fact_transaction" USING btree ("account_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transaction_security" ON "fact_transaction" USING btree ("security_key");--> statement-breakpoint
CREATE INDEX "idx_stg_transaction_account_status" ON "stg_transaction" USING btree ("account_key","status");--> statement-breakpoint
CREATE INDEX "idx_stg_transaction_broker_id" ON "stg_transaction" USING btree ("broker_transaction_id");--> statement-breakpoint
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_email_unique" UNIQUE("email");--> statement-breakpoint

CREATE OR REPLACE VIEW "public"."view_position" AS (
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
      -- Different thresholds for different asset types
      WHEN MAX(s.security_type) = 'OPTION' AND ABS(SUM(ft.quantity)) > 0.001 THEN 'OPEN'
      WHEN MAX(s.security_type) = 'STOCK' AND ABS(SUM(ft.quantity)) > 0.0001 THEN 'OPEN'
      ELSE 'CLOSED' 
    END as position_status,
    
    -- Transaction metadata
    MIN(d.full_date) as first_transaction_date,
    MAX(d.full_date) as last_transaction_date,
    COUNT(*)::integer as transaction_count,

    -- Expiration date
    CASE
      WHEN MAX(s.expiry_date) IS NOT NULL 
      THEN MAX(s.expiry_date)
      ELSE NULL
    END as expiry_date

  FROM "fact_transaction" ft
  JOIN "dim_security" s ON ft.security_key = s.security_key
  JOIN "dim_account" a ON ft.account_key = a.account_key
  JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
  JOIN "dim_date" d ON ft.date_key = d.date_key
  WHERE tt.action_category IN ('TRADE', 'CORPORATE')
  GROUP BY a.account_key, s.symbol, s.underlying_symbol, s.strike_price
);--> statement-breakpoint

CREATE VIEW "public"."view_portfolio_distribution" AS (
  SELECT
    account_key,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY account_key)) * 100 as portfolio_percentage

  FROM "view_position"
  WHERE position_status = 'OPEN'
  GROUP BY account_key, underlying_symbol
  ORDER BY ABS(SUM(position_value)) DESC
);--> statement-breakpoint

CREATE VIEW "public"."view_portfolio_summary" AS (
  WITH portfolio_value_calc AS (
    -- Calculate total portfolio value from all transaction flows
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_portfolio_value
    FROM "fact_transaction" ft
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    GROUP BY a.account_key
  ),

  position_values_calc AS (
    -- Current invested amount (position value of held positions)
    -- Note: position_value can be negative for short positions, positive for long positions
    SELECT
      account_key,
      SUM(position_value) as total_position_value
    FROM "view_position"
    WHERE position_status = 'OPEN'
    GROUP BY account_key
  ),

  realised_monthly_pnl AS (
    -- Realised P/L for current month
    SELECT
      a.account_key,
      SUM(ft.net_amount) as monthly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  realised_yearly_pnl AS (
    -- Realised P/L for current year
    SELECT
      a.account_key,
      SUM(ft.net_amount) as yearly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  realised_weekly_pnl AS (
    -- Realised P/L for current week
    SELECT
      a.account_key,
      SUM(ft.net_amount) as weekly_realised_pnl
    FROM "fact_transaction" ft
    JOIN "dim_date" d ON ft.date_key = d.date_key
    JOIN "dim_account" a ON ft.account_key = a.account_key
    JOIN "dim_transaction_type" tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.full_date >= DATE_TRUNC('week', CURRENT_DATE)
      AND d.full_date <= CURRENT_DATE
    GROUP BY a.account_key
  )

  -- Final summary query
  SELECT
    a.account_key,
    COALESCE(pv.total_portfolio_value, 0) as portfolio_value,
    COALESCE(pv.total_portfolio_value - COALESCE(pvs.total_position_value, 0), pv.total_portfolio_value, 0) as cash_balance,
    COALESCE(mp.monthly_realised_pnl, 0) as monthly_pnl,
    COALESCE(yp.yearly_realised_pnl, 0) as yearly_pnl,

    -- Calculate percentage changes
    CASE
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(mp.monthly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as monthly_pnl_percent,

    CASE
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(yp.yearly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as yearly_pnl_percent,

    CASE
      WHEN COALESCE(pv.total_portfolio_value, 0) != 0
      THEN (COALESCE(wp.weekly_realised_pnl, 0) / pv.total_portfolio_value * 100)
      ELSE 0
    END as weekly_pnl_percent

  FROM "dim_account" a
  LEFT JOIN portfolio_value_calc pv ON a.account_key = pv.account_key
  LEFT JOIN position_values_calc pvs ON a.account_key = pvs.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN realised_weekly_pnl wp ON a.account_key = wp.account_key
  WHERE a.is_active = true
);--> statement-breakpoint

CREATE OR REPLACE VIEW "public"."view_weekly_return" AS (
  WITH weekly_data AS (
      SELECT
          a.account_key,
          d.week_ending_date as week_start,
          -- Weekly transfers (money wire in/out)
          SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
          -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
          SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
      FROM "fact_transaction" ft
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
);