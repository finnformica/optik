CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "dim_account" (
	"account_key" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_name" varchar(100) DEFAULT 'Primary Account',
	"account_type" varchar(50) DEFAULT 'INDIVIDUAL',
	"currency" varchar(3) DEFAULT 'USD',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_account" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "dim_broker" (
	"broker_key" serial PRIMARY KEY NOT NULL,
	"broker_code" varchar(20) NOT NULL,
	"broker_name" varchar(100),
	"commission_structure" varchar(100),
	"api_provider" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dim_broker_broker_code_unique" UNIQUE("broker_code")
);
--> statement-breakpoint
CREATE TABLE "dim_date" (
	"date_key" integer PRIMARY KEY NOT NULL,
	"full_date" date NOT NULL,
	"day_of_week" varchar(10),
	"day_of_month" integer,
	"week_of_year" integer,
	"month_name" varchar(10),
	"month_number" integer,
	"quarter" integer,
	"year" integer,
	"is_weekend" boolean,
	"is_trading_day" boolean,
	"week_ending_date" date,
	"month_ending_date" date,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "dim_date_full_date_unique" UNIQUE("full_date")
);
--> statement-breakpoint
CREATE TABLE "dim_security" (
	"security_key" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"security_type" varchar(20) NOT NULL,
	"option_type" varchar(10),
	"strike_price" numeric(18, 8),
	"expiry_date" date,
	"security_name" text,
	"underlying_symbol" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "check_stock_option" CHECK (
    (security_type = 'STOCK' AND underlying_symbol = symbol AND option_type IS NULL AND strike_price IS NULL AND expiry_date IS NULL)
    OR
    (security_type = 'OPTION' AND underlying_symbol != symbol AND option_type IS NOT NULL AND strike_price IS NOT NULL AND expiry_date IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "dim_transaction_type" (
	"transaction_type_key" serial PRIMARY KEY NOT NULL,
	"action_code" varchar(20) NOT NULL,
	"action_description" varchar(100),
	"action_category" varchar(50),
	"affects_position" boolean,
	"direction" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dim_transaction_type_action_code_unique" UNIQUE("action_code")
);
--> statement-breakpoint
CREATE TABLE "fact_current_positions" (
	"account_key" integer NOT NULL,
	"security_key" integer NOT NULL,
	"quantity_held" numeric(18, 8) NOT NULL,
	"cost_basis" numeric(18, 8) NOT NULL,
	"average_price" numeric(18, 8),
	"first_transaction_date" date,
	"last_transaction_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "fact_current_positions_account_key_security_key_pk" PRIMARY KEY("account_key","security_key")
);
--> statement-breakpoint
CREATE TABLE "fact_transactions" (
	"date_key" integer NOT NULL,
	"account_key" integer NOT NULL,
	"security_key" integer NOT NULL,
	"transaction_type_key" integer NOT NULL,
	"broker_key" integer NOT NULL,
	"broker_transaction_id" varchar(50) PRIMARY KEY NOT NULL,
	"order_id" varchar(50),
	"original_transaction_id" integer,
	"quantity" numeric(18, 8) NOT NULL,
	"price_per_unit" numeric(18, 8),
	"gross_amount" numeric(18, 8) NOT NULL,
	"fees" numeric(18, 8) DEFAULT '0' NOT NULL,
	"net_amount" numeric(18, 8) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_transaction" UNIQUE("broker_transaction_id","original_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"broker_code" varchar(20) NOT NULL,
	"broker_transaction_id" varchar(50) NOT NULL,
	"raw_data" json NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"broker_timestamp" timestamp NOT NULL,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_broker_transaction" UNIQUE("broker_transaction_id","broker_code")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"plan_name" varchar(50),
	"subscription_status" varchar(20),
	CONSTRAINT "teams_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "teams_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_access_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"encrypted_tokens" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token_type" varchar(50) NOT NULL,
	"scope" varchar(255) NOT NULL,
	"broker" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dim_account" ADD CONSTRAINT "dim_account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_current_positions" ADD CONSTRAINT "fact_current_positions_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_current_positions" ADD CONSTRAINT "fact_current_positions_security_key_dim_security_security_key_fk" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_current_positions" ADD CONSTRAINT "fk_fact_current_positions_security" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fact_transactions_date_key_dim_date_date_key_fk" FOREIGN KEY ("date_key") REFERENCES "public"."dim_date"("date_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fact_transactions_account_key_dim_account_account_key_fk" FOREIGN KEY ("account_key") REFERENCES "public"."dim_account"("account_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fact_transactions_security_key_dim_security_security_key_fk" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fact_transactions_transaction_type_key_dim_transaction_type_transaction_type_key_fk" FOREIGN KEY ("transaction_type_key") REFERENCES "public"."dim_transaction_type"("transaction_type_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fact_transactions_broker_key_dim_broker_broker_key_fk" FOREIGN KEY ("broker_key") REFERENCES "public"."dim_broker"("broker_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_transactions" ADD CONSTRAINT "fk_fact_transactions_security" FOREIGN KEY ("security_key") REFERENCES "public"."dim_security"("security_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_transactions" ADD CONSTRAINT "raw_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_access_tokens" ADD CONSTRAINT "user_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dim_date_full_date" ON "dim_date" USING btree ("full_date");--> statement-breakpoint
CREATE INDEX "idx_dim_date_year_month" ON "dim_date" USING btree ("year","month_number");--> statement-breakpoint
CREATE INDEX "idx_dim_security_underlying" ON "dim_security" USING btree ("underlying_symbol");--> statement-breakpoint
CREATE INDEX "idx_dim_security_type" ON "dim_security" USING btree ("security_type");--> statement-breakpoint
CREATE INDEX "idx_dim_security_symbol" ON "dim_security" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "idx_fact_positions_account" ON "fact_current_positions" USING btree ("account_key");--> statement-breakpoint
CREATE INDEX "idx_fact_positions_security" ON "fact_current_positions" USING btree ("security_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transactions_date" ON "fact_transactions" USING btree ("date_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transactions_account" ON "fact_transactions" USING btree ("account_key");--> statement-breakpoint
CREATE INDEX "idx_fact_transactions_security" ON "fact_transactions" USING btree ("security_key");--> statement-breakpoint
CREATE INDEX "idx_raw_transactions_user_status" ON "raw_transactions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_raw_transactions_broker_id" ON "raw_transactions" USING btree ("broker_transaction_id");--> statement-breakpoint
CREATE VIEW "public"."view_account_value_over_time" AS (
  WITH weekly_data AS (
    SELECT 
      a.user_id,
      d.week_ending_date as week_start,
      -- Weekly transfers (money wire in/out)
      SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount * tt.direction ELSE 0 END) as weekly_transfers,
      -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
      SUM(CASE 
        WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount * tt.direction
        ELSE 0
      END) as weekly_gains
    FROM fact_transactions ft
    JOIN dim_date d ON ft.date_key = d.date_key
    JOIN dim_account a ON ft.account_key = a.account_key
    JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date <= CURRENT_DATE
    GROUP BY a.user_id, d.week_ending_date
  )
  SELECT 
    user_id,
    week_start,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_transfers,
    SUM(weekly_transfers) OVER (PARTITION BY user_id ORDER BY week_start) + 
    SUM(weekly_gains) OVER (PARTITION BY user_id ORDER BY week_start) as cumulative_portfolio_value
  FROM weekly_data
  ORDER BY user_id, week_start
);--> statement-breakpoint
CREATE VIEW "public"."view_company_positions" AS (
  SELECT 
    a.user_id,
    s.underlying_symbol as company_symbol,
    s.underlying_symbol as display_name,
    
    -- Position counts
    COUNT(*)::integer as total_positions,
    COUNT(*) FILTER (WHERE s.security_type = 'STOCK')::integer as stock_positions,
    COUNT(*) FILTER (WHERE s.security_type = 'OPTION')::integer as option_positions,
    
    -- Quantity aggregations
    SUM(ABS(p.quantity_held)) as total_contracts_shares,
    SUM(CASE WHEN s.security_type = 'STOCK' THEN p.quantity_held ELSE 0 END) as stock_shares,
    
    -- Options breakdown for strategy identification
    SUM(CASE WHEN s.option_type = 'PUT' AND p.quantity_held < 0 THEN ABS(p.quantity_held) ELSE 0 END) as short_puts,
    SUM(CASE WHEN s.option_type = 'CALL' AND p.quantity_held < 0 THEN ABS(p.quantity_held) ELSE 0 END) as short_calls,
    SUM(CASE WHEN s.option_type = 'PUT' AND p.quantity_held > 0 THEN p.quantity_held ELSE 0 END) as long_puts,
    SUM(CASE WHEN s.option_type = 'CALL' AND p.quantity_held > 0 THEN p.quantity_held ELSE 0 END) as long_calls,
    
    -- Financial aggregations
    SUM(p.cost_basis) as total_cost_basis,
    MIN(p.first_transaction_date) as first_position_date,
    MAX(p.last_transaction_date) as most_recent_transaction,
    
    -- Strategy classification
    CASE 
      WHEN SUM(CASE WHEN s.option_type = 'PUT' AND p.quantity_held < 0 THEN 1 ELSE 0 END) > 0 
       AND SUM(CASE WHEN s.option_type = 'CALL' AND p.quantity_held < 0 THEN 1 ELSE 0 END) = 0 
      THEN 'CASH_SECURED_PUTS'
      WHEN SUM(CASE WHEN s.option_type = 'CALL' AND p.quantity_held < 0 THEN 1 ELSE 0 END) > 0 
       AND SUM(CASE WHEN s.option_type = 'PUT' AND p.quantity_held < 0 THEN 1 ELSE 0 END) = 0
      THEN 'COVERED_CALLS'  
      WHEN SUM(CASE WHEN s.option_type = 'PUT' AND p.quantity_held < 0 THEN 1 ELSE 0 END) > 0 
       AND SUM(CASE WHEN s.option_type = 'CALL' AND p.quantity_held < 0 THEN 1 ELSE 0 END) > 0
      THEN 'SHORT_STRANGLE'
      ELSE 'MIXED_STRATEGY'
    END as primary_strategy

  FROM fact_current_positions p
  JOIN dim_security s ON p.security_key = s.security_key
  JOIN dim_account a ON p.account_key = a.account_key
  WHERE p.quantity_held != 0
  GROUP BY a.user_id, s.underlying_symbol
  ORDER BY ABS(SUM(p.cost_basis)) DESC
);--> statement-breakpoint
CREATE VIEW "public"."view_portfolio_distribution" AS (
  SELECT 
    a.user_id,
    s.underlying_symbol as company,
    SUM(ABS(p.cost_basis)) as position_value,
    COUNT(*)::integer as instrument_count,
    (SUM(ABS(p.cost_basis)) / SUM(SUM(ABS(p.cost_basis))) OVER (PARTITION BY a.user_id)) * 100 as portfolio_percentage
    
  FROM fact_current_positions p
  JOIN dim_security s ON p.security_key = s.security_key
  JOIN dim_account a ON p.account_key = a.account_key
  WHERE p.quantity_held != 0
  GROUP BY a.user_id, s.underlying_symbol
  ORDER BY position_value DESC
);--> statement-breakpoint
CREATE VIEW "public"."view_positions" AS (
  WITH all_position_activity AS (
    -- Get comprehensive trading activity for each unique position
    SELECT 
      a.user_id,
      s.security_key,
      
      -- Position quantity tracking
      SUM(
        CASE WHEN tt.action_category = 'TRADE' 
        THEN ft.quantity * tt.direction 
        ELSE 0 END
      ) as historical_net_quantity,
      
      -- Cost basis calculation  
      SUM(
        CASE WHEN tt.action_category = 'TRADE' 
        THEN ft.net_amount * tt.direction 
        ELSE 0 END
      ) as historical_cost_basis,
      
      -- Weighted average price calculation
      SUM(
        CASE WHEN tt.action_category = 'TRADE' AND ABS(ft.quantity) > 0
        THEN ABS(ft.quantity) * ft.price_per_unit
        ELSE 0 END
      ) / NULLIF(SUM(
        CASE WHEN tt.action_category = 'TRADE' AND ABS(ft.quantity) > 0
        THEN ABS(ft.quantity)
        ELSE 0 END
      ), 0) as weighted_average_price,
      
      -- Realised P/L calculation (profit/loss from closing trades)
      SUM(
        CASE WHEN tt.action_category = 'TRADE'
        THEN ft.net_amount * tt.direction
        ELSE 0 END
      ) as realised_pnl,
      
      -- Total trading fees
      SUM(
        CASE WHEN tt.action_category = 'TRADE'
        THEN ft.fees
        ELSE 0 END
      ) as total_position_fees,
      
      -- Transaction metadata
      MIN(d.full_date) as first_transaction_date,
      MAX(d.full_date) as last_transaction_date,
      COUNT(CASE WHEN tt.action_category = 'TRADE' THEN 1 END)::integer as transaction_count
      
    FROM fact_transactions ft
    JOIN dim_account a ON ft.account_key = a.account_key
    JOIN dim_security s ON ft.security_key = s.security_key
    JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key
    JOIN dim_date d ON ft.date_key = d.date_key
    GROUP BY a.user_id, s.security_key
  ),
  
  unified_positions AS (
    -- Combine historical activity with current position data
    SELECT 
      apa.*,
      -- Get security details for the final output
      s.symbol,
      s.security_type,
      s.underlying_symbol,
      s.option_type,
      s.strike_price,
      s.expiry_date,

      -- Current position data from fact_current_positions
      COALESCE(fcp.quantity_held, 0) as current_quantity_held,
      COALESCE(fcp.cost_basis, 0) as current_cost_basis,
      COALESCE(fcp.average_price, apa.weighted_average_price) as current_avg_price
      
    FROM all_position_activity apa
    JOIN dim_security s ON apa.security_key = s.security_key
    LEFT JOIN fact_current_positions fcp ON EXISTS (
      SELECT 1 FROM dim_account da 
      WHERE da.account_key = fcp.account_key 
      AND da.user_id = apa.user_id
    ) AND EXISTS (
      SELECT 1 FROM dim_security ds 
      WHERE ds.security_key = fcp.security_key
    )
  )

  SELECT 
    user_id,
    symbol,
    security_type,
    underlying_symbol,
    option_type,
    strike_price,
    expiry_date,
    current_quantity_held as quantity_held,
    current_cost_basis as cost_basis,
    current_avg_price as average_price,
    realised_pnl,
    total_position_fees as total_fees,
    
    -- Days to expiry calculation
    CASE 
      WHEN expiry_date IS NOT NULL 
      THEN (expiry_date - CURRENT_DATE)::integer
      ELSE NULL
    END as days_to_expiry,
    
    -- Position direction
    CASE 
      WHEN current_quantity_held > 0.001 THEN 'LONG' 
      WHEN current_quantity_held < -0.001 THEN 'SHORT'
      ELSE 'CLOSED'
    END as direction,
    
    -- Position status flag
    CASE 
      WHEN ABS(current_quantity_held) > 0.001 THEN 'OPEN'
      ELSE 'CLOSED'
    END as position_status,
    
    first_transaction_date,
    last_transaction_date,
    transaction_count
    
  FROM unified_positions
  WHERE transaction_count > 0  -- Only positions with actual trades
  ORDER BY 
    position_status ASC,  -- CLOSED comes before OPEN alphabetically, so OPEN positions first
    ABS(current_cost_basis) DESC  -- Then by position size
);