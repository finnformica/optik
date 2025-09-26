import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// =============================================
// REALTIME TABLES
// =============================================

export const rtmSyncProgress = pgTable(
  "rtm_sync_progress",
  {
    id: serial("id").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull(),
    progress: integer("progress").notNull().default(0),
    total: integer("total").notNull().default(0),
    processed: integer("processed").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    remaining: integer("remaining").notNull().default(0),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("rtm_sync_progress_account_key_unique").on(table.accountKey),
  ],
);

// =============================================
// STAGING TABLES
// =============================================

export const stgTransaction = pgTable(
  "stg_transaction",
  {
    id: serial("id").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey, { onDelete: "cascade" }),
    brokerCode: varchar("broker_code", { length: 20 }).notNull(),
    brokerTransactionId: varchar("broker_transaction_id", {
      length: 50,
    }).notNull(),

    // Raw broker data
    rawData: jsonb("raw_data").notNull(),

    // Processing status
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    errorMessage: text("error_message"),

    // Timestamps
    brokerTimestamp: timestamp("broker_timestamp").notNull(), // When transaction actually occurred per broker
    processedAt: timestamp("processed_at"), // When we processed it into dimensional model
    createdAt: timestamp("created_at").notNull().defaultNow(), // When record was inserted
    updatedAt: timestamp("updated_at").notNull().defaultNow(), // When record was last modified
  },
  (table) => [
    unique("unique_account_broker_transaction").on(
      table.accountKey,
      table.brokerTransactionId,
      table.brokerCode,
    ),
    index("idx_stg_transaction_account_status").on(
      table.accountKey,
      table.status,
    ),
    index("idx_stg_transaction_broker_id").on(table.brokerTransactionId),
    pgPolicy("users_own_staging_transactions", {
      for: "all",
      to: "authenticated",
      using: sql`${table.accountKey} IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      )`,
    }),
  ],
);

// =============================================
// DIMENSIONAL TABLES
// =============================================

// User Dimension - Represents a user of the application
export const dimUser = pgTable(
  "dim_user",
  {
    id: serial("id").primaryKey(),
    authUserId: uuid("auth_user_id")
      .unique()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 50 }),
    lastName: varchar("last_name", { length: 50 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    role: varchar("role", { length: 20 }).notNull().default("basic"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("idx_dim_user_auth_user_id").on(table.authUserId),
    pgPolicy("users_own_data", {
      for: "all",
      to: "authenticated",
      using: sql`${table.id} = current_setting('app.current_user_id')::int`,
    }),
  ],
);

// Account Dimension - Represents an account of a user
export const dimAccount = pgTable(
  "dim_account",
  {
    accountKey: serial("account_key").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => dimUser.id, { onDelete: "cascade" }),
    accountName: varchar("account_name", { length: 100 }).default(
      "Primary Account",
    ),
    accountType: varchar("account_type", { length: 50 }).default("INDIVIDUAL"), // INDIVIDUAL, JOINT, CORPORATE, IRA, ROTH, 401K, 403B, 529, OTHER
    currency: varchar("currency", { length: 3 }).default("USD"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    pgPolicy("users_own_accounts", {
      for: "all",
      to: "authenticated",
      using: sql`${table.userId} = current_setting('app.current_user_id')::int`,
    }),
  ],
);

// Account Access Token Dimension
export const dimAccountAccessToken = pgTable(
  "dim_account_access_token",
  {
    accessTokenKey: serial("access_token_key").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey, { onDelete: "cascade" }),
    encryptedTokens: text("encrypted_tokens").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    tokenType: varchar("token_type", { length: 50 }).notNull(),
    scope: varchar("scope", { length: 255 }).notNull(),
    brokerCode: varchar("broker_code", { length: 20 })
      .notNull()
      .references(() => dimBroker.brokerCode, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_account_broker_token").on(
      table.accountKey,
      table.brokerCode,
    ),
    pgPolicy("users_own_account_tokens", {
      for: "all",
      to: "authenticated",
      using: sql`${table.accountKey} IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      )`,
    }),
  ],
);

// Date Dimension
export const dimDate = pgTable(
  "dim_date",
  {
    dateKey: integer("date_key").primaryKey(), // YYYYMMDD format
    fullDate: date("full_date").notNull().unique(),
    dayOfWeek: varchar("day_of_week", { length: 10 }),
    dayOfMonth: integer("day_of_month"),
    weekOfYear: integer("week_of_year"),
    monthName: varchar("month_name", { length: 10 }),
    monthNumber: integer("month_number"),
    quarter: integer("quarter"),
    year: integer("year"),
    isWeekend: boolean("is_weekend"),
    isTradingDay: boolean("is_trading_day"),
    weekEndingDate: date("week_ending_date"),
    weekStartingDate: date("week_starting_date"),
    monthEndingDate: date("month_ending_date"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_dim_date_full_date").on(table.fullDate),
    index("idx_dim_date_year_month").on(table.year, table.monthNumber),
    pgPolicy("authenticated_can_read_dates", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// Time Dimension
export const dimTime = pgTable(
  "dim_time",
  {
    timeKey: serial("time_key").primaryKey(), // Sequential integer 1-86400
    timeValue: varchar("time_value", { length: 8 }).notNull().unique(), // HH:MM:SS format
    hour: integer("hour").notNull(), // 0-23
    minute: integer("minute").notNull(), // 0-59
    second: integer("second").notNull(), // 0-59
    hourMinute: varchar("hour_minute", { length: 5 }).notNull(), // HH:MM format
    periodOfDay: varchar("period_of_day", { length: 20 }), // Morning, Afternoon, Evening, Night
    isMarketHours: boolean("is_market_hours").default(false), // Assuming US market hours 9:30-16:00 EST
    quarterHour: integer("quarter_hour").notNull(), // 1-96 (15-minute intervals in a day)
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_dim_time_hour").on(table.hour),
    index("idx_dim_time_hour_minute").on(table.hour, table.minute),
    index("idx_dim_time_time_value").on(table.timeValue),
    pgPolicy("authenticated_can_read_times", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// Security Dimension - Handles stocks and options with company grouping
export const dimSecurity = pgTable(
  "dim_security",
  {
    securityKey: serial("security_key").primaryKey(),

    symbol: varchar("symbol", { length: 50 }).notNull(),
    securityType: varchar("security_type", { length: 20 }).notNull(), // 'STOCK', 'OPTION'
    optionType: varchar("option_type", { length: 10 }), // 'CALL', 'PUT', NULL for stocks
    strikePrice: decimal("strike_price", { precision: 18, scale: 8 }), // NULL for stocks
    expiryDate: date("expiry_date"), // NULL for stocks

    // Essential fields for company-level aggregation
    securityName: text("security_name"),
    underlyingSymbol: varchar("underlying_symbol", { length: 50 }).notNull(), // Key for company grouping

    // Metadata
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    // Performance indexes
    index("idx_dim_security_underlying").on(table.underlyingSymbol),
    index("idx_dim_security_type").on(table.securityType),
    index("idx_dim_security_symbol").on(table.symbol),
    // Data integrity constraint
    check(
      "check_stock_option",
      sql`
    (security_type = 'STOCK' AND underlying_symbol = symbol AND option_type IS NULL AND strike_price IS NULL AND expiry_date IS NULL)
    OR
    (security_type = 'OPTION' AND underlying_symbol != symbol AND option_type IS NOT NULL AND strike_price IS NOT NULL AND expiry_date IS NOT NULL)
  `,
    ),
    pgPolicy("authenticated_can_read_securities", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// Transaction Type Dimension
export const dimTransactionType = pgTable(
  "dim_transaction_type",
  {
    transactionTypeKey: serial("transaction_type_key").primaryKey(),
    actionCode: varchar("action_code", { length: 20 }).notNull().unique(),
    actionDescription: varchar("action_description", { length: 100 }),
    actionCategory: varchar("action_category", { length: 50 }), // 'TRADE', 'INCOME', 'TRANSFER', 'CORPORATE'
    affectsPosition: boolean("affects_position"),
    direction: integer("direction"), // +1 for inflows, -1 for outflows, 0 for neutral
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    pgPolicy("authenticated_can_read_transaction_types", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// Broker Dimension
export const dimBroker = pgTable(
  "dim_broker",
  {
    brokerKey: serial("broker_key").primaryKey(),
    brokerCode: varchar("broker_code", { length: 20 }).notNull().unique(),
    brokerName: varchar("broker_name", { length: 100 }),
    commissionStructure: varchar("commission_structure", { length: 100 }),
    apiProvider: varchar("api_provider", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  () => [
    pgPolicy("authenticated_can_read_brokers", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// Broker Account Dimension - Maps broker accounts to user accounts
export const dimBrokerAccount = pgTable(
  "dim_broker_account",
  {
    brokerAccountKey: serial("broker_account_key").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey, { onDelete: "cascade" }),
    brokerKey: integer("broker_key")
      .notNull()
      .references(() => dimBroker.brokerKey, { onDelete: "cascade" }),
    brokerAccountNumber: varchar("broker_account_number", {
      length: 50,
    }).notNull(),
    brokerAccountHash: varchar("broker_account_hash", {
      length: 100,
    }).notNull(),
    brokerAccountType: varchar("broker_account_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("unique_broker_account").on(
      table.accountKey,
      table.brokerKey,
      table.brokerAccountNumber,
    ),
    index("idx_broker_account_account_broker").on(
      table.accountKey,
      table.brokerKey,
    ),
    index("idx_broker_account_hash").on(table.brokerAccountHash),
    pgPolicy("users_own_broker_accounts", {
      for: "all",
      to: "authenticated",
      using: sql`${table.accountKey} IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      )`,
    }),
  ],
);

// =============================================
// FACT TABLES
// =============================================

// Transaction Fact Table - One row per trade
export const factTransaction = pgTable(
  "fact_transaction",
  {
    // Primary key
    transactionKey: serial("transaction_key").primaryKey(),

    // Dimension Foreign Keys
    dateKey: integer("date_key")
      .notNull()
      .references(() => dimDate.dateKey),
    timeKey: integer("time_key")
      .notNull()
      .references(() => dimTime.timeKey),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey, { onDelete: "cascade" }),
    securityKey: integer("security_key").references(
      () => dimSecurity.securityKey,
    ),
    transactionTypeKey: integer("transaction_type_key")
      .notNull()
      .references(() => dimTransactionType.transactionTypeKey),
    brokerKey: integer("broker_key")
      .notNull()
      .references(() => dimBroker.brokerKey, { onDelete: "no action" }),

    // Degenerate dimensions (stay in fact table)
    brokerTransactionId: varchar("broker_transaction_id", {
      length: 50,
    }).notNull(),
    orderId: varchar("order_id", { length: 50 }),
    originalTransactionId: integer("original_transaction_id"), // Reference to legacy transactions.id
    description: text("description"),

    // Facts (measurements)
    quantity: decimal("quantity", { precision: 18, scale: 8 }).notNull(),
    pricePerUnit: decimal("price_per_unit", { precision: 18, scale: 8 }),
    grossAmount: decimal("gross_amount", { precision: 18, scale: 8 }).notNull(),
    fees: decimal("fees", { precision: 18, scale: 8 }).notNull().default("0"),
    netAmount: decimal("net_amount", { precision: 18, scale: 8 }).notNull(),

    // Metadata
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    // Foreign key to security dimension
    foreignKey({
      columns: [table.securityKey],
      foreignColumns: [dimSecurity.securityKey],
      name: "fk_fact_transaction_security",
    }),

    // Unique constraint for idempotent loading per account
    unique("unique_account_transaction").on(
      table.accountKey,
      table.brokerTransactionId,
      table.originalTransactionId,
    ),

    // Performance indexes
    index("idx_fact_transaction_date").on(table.dateKey),
    index("idx_fact_transaction_time").on(table.timeKey),
    index("idx_fact_transaction_date_time").on(table.dateKey, table.timeKey),
    index("idx_fact_transaction_account").on(table.accountKey),
    index("idx_fact_transaction_security").on(table.securityKey),

    // RLS Policy
    pgPolicy("users_own_transactions", {
      for: "all",
      to: "authenticated",
      using: sql`${table.accountKey} IN (
        SELECT account_key FROM dim_account
        WHERE user_id = current_setting('app.current_user_id')::int
      )`,
    }),
  ],
);

// Stock Prices Fact Table - Caches stock prices in 15-minute intervals
export const factStockPrices = pgTable(
  "fact_stock_prices",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    dateKey: integer("date_key")
      .notNull()
      .references(() => dimDate.dateKey),
    quarterHour: integer("quarter_hour").notNull(),
    price: decimal("price", { precision: 18, scale: 8 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint for caching - one price per symbol per 15-minute interval
    unique("unique_symbol_time_cache").on(
      table.symbol,
      table.dateKey,
      table.quarterHour,
    ),
    // Performance indexes
    index("idx_fact_stock_prices_symbol").on(table.symbol),
    index("idx_fact_stock_prices_date_time").on(
      table.dateKey,
      table.quarterHour,
    ),
    index("idx_fact_stock_prices_created_at").on(table.createdAt),
    // RLS Policy - all authenticated users can read stock prices
    pgPolicy("authenticated_can_read_stock_prices", {
      for: "select",
      to: "authenticated",
      using: sql`true`,
    }),
  ],
);

// =============================================
// ANALYTICAL VIEWS
// =============================================

// Weekly Position View - Time-aware position calculations for each week
export const viewWeeklyPosition = pgView("view_weekly_position", {
  accountKey: integer("account_key"),
  weekStart: date("week_start"),
  symbol: varchar("symbol", { length: 50 }),
  securityType: varchar("security_type", { length: 20 }),
  underlyingSymbol: varchar("underlying_symbol", { length: 50 }),
  quantity: decimal("quantity", { precision: 18, scale: 8 }),
  avgCostPerUnit: decimal("avg_cost_per_unit", { precision: 18, scale: 8 }),
  firstTransactionDate: date("first_transaction_date"),
  lastTransactionDate: date("last_transaction_date"),
  positionValue: decimal("position_value", { precision: 18, scale: 8 }),
  positionStatus: varchar("position_status", { length: 10 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 18, scale: 8 }),
  expiryDate: date("expiry_date"),
  optionType: varchar("option_type", { length: 10 }),
  strikePrice: decimal("strike_price", { precision: 18, scale: 8 }),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH weekly_date_series AS (
    -- Get all unique weeks where transactions occurred
    SELECT DISTINCT
      d.week_starting_date as week_start,
      ft.account_key
    FROM ${factTransaction} ft
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    WHERE a.is_active = true
  ),

  position_calculations AS (
    SELECT
      wds.account_key,
      wds.week_start,
      ds.symbol,
      ds.security_type,
      ds.underlying_symbol,

      -- Sum all transactions for this symbol up to and including this week
      SUM(ft.quantity) as cumulative_quantity,
      SUM(ABS(ft.net_amount)) as total_cost,
      SUM(ABS(ft.quantity)) as total_quantity,

      -- Calculate average cost per unit
      CASE
        WHEN SUM(ABS(ft.quantity)) > 0
        THEN SUM(ABS(ft.net_amount)) / SUM(ABS(ft.quantity))
        ELSE 0
      END as avg_cost_per_unit,

      MIN(d.full_date) as first_transaction_date,
      MAX(d.full_date) as last_transaction_date

    FROM weekly_date_series wds
    JOIN ${factTransaction} ft ON ft.account_key = wds.account_key
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimSecurity} ds ON ft.security_key = ds.security_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.week_starting_date <= wds.week_start  -- Only transactions up to this week
    AND tt.action_category IN ('TRADE', 'CORPORATE')
    GROUP BY wds.account_key, wds.week_start, ds.symbol, ds.security_type, ds.underlying_symbol
    HAVING SUM(ft.quantity) != 0  -- Only positions that are open
  )

  SELECT
    pc.account_key,
    pc.week_start,
    pc.symbol,
    pc.security_type,
    pc.underlying_symbol,
    pc.cumulative_quantity as quantity,
    pc.avg_cost_per_unit,
    pc.first_transaction_date,
    pc.last_transaction_date,

    -- Position value: stocks use cost basis, options use collateral value
    CASE
      WHEN ds.security_type = 'STOCK' THEN ABS(pc.cumulative_quantity) * pc.avg_cost_per_unit
      WHEN ds.security_type = 'OPTION' THEN ABS(pc.cumulative_quantity) * ds.strike_price * 100
      ELSE ABS(pc.cumulative_quantity) * pc.avg_cost_per_unit
    END as position_value,

    'OPEN' as position_status,
    0 as unrealized_pnl,
    ds.expiry_date,
    ds.option_type,
    ds.strike_price

  FROM position_calculations pc
  LEFT JOIN ${dimSecurity} ds ON pc.symbol = ds.symbol
  ORDER BY pc.account_key, pc.week_start, pc.symbol
`);

// Current Position View - Shows current positions from latest week of viewWeeklyPosition
export const viewCurrentPosition = pgView("view_current_position", {
  accountKey: integer("account_key"),
  symbol: varchar("symbol", { length: 50 }),
  securityType: varchar("security_type", { length: 20 }),
  underlyingSymbol: varchar("underlying_symbol", { length: 50 }),
  quantity: decimal("quantity", { precision: 18, scale: 8 }),
  avgCostPerUnit: decimal("avg_cost_per_unit", { precision: 18, scale: 8 }),
  firstTransactionDate: date("first_transaction_date"),
  lastTransactionDate: date("last_transaction_date"),
  positionValue: decimal("position_value", { precision: 18, scale: 8 }),
  positionStatus: varchar("position_status", { length: 10 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 18, scale: 8 }),
  optionType: varchar("option_type", { length: 10 }),
  expiryDate: date("expiry_date"),
  strikePrice: decimal("strike_price", { precision: 18, scale: 8 }),
}).with({
  securityInvoker: true,
}).as(sql`
  SELECT
    account_key,
    symbol,
    security_type,
    underlying_symbol,
    quantity,
    avg_cost_per_unit,
    first_transaction_date,
    last_transaction_date,
    position_value,
    position_status,
    unrealized_pnl,
    option_type,
    expiry_date,
    strike_price
  FROM ${viewWeeklyPosition}
  WHERE week_start = (SELECT MAX(week_start) FROM ${viewWeeklyPosition})
`);

// Weekly Portfolio Value View - Time-series portfolio values using viewWeeklyPosition
export const viewWeeklyPortfolioValue = pgView("view_weekly_portfolio_value", {
  accountKey: integer("account_key"),
  weekStart: date("week_start"),
  cashFlows: decimal("cash_flows", { precision: 18, scale: 8 }),
  stockPositionValue: decimal("stock_position_value", {
    precision: 18,
    scale: 8,
  }),
  optionCollateralValue: decimal("option_collateral_value", {
    precision: 18,
    scale: 8,
  }),
  cumulativeTransfers: decimal("cumulative_transfers", {
    precision: 18,
    scale: 8,
  }),
  totalPortfolioValue: decimal("total_portfolio_value", {
    precision: 18,
    scale: 8,
  }),
  availableCash: decimal("available_cash", { precision: 18, scale: 8 }),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH weekly_date_series AS (
    -- Generate all weeks from earliest transaction to current date
    SELECT DISTINCT
      week_start,
      account_key
    FROM ${viewWeeklyPosition}
  ),

  weekly_cash_flows AS (
    -- Calculate cumulative cash flows up to each week
    SELECT
      wds.account_key,
      wds.week_start,
      COALESCE(SUM(ft.net_amount), 0) as cash_flows_to_date
    FROM weekly_date_series wds
    LEFT JOIN ${factTransaction} ft ON ft.account_key = wds.account_key
    LEFT JOIN ${dimDate} d ON ft.date_key = d.date_key
    WHERE d.week_starting_date <= wds.week_start OR ft.transaction_key IS NULL
    GROUP BY wds.account_key, wds.week_start
  ),

  weekly_transfers AS (
    -- Calculate cumulative transfers up to each week
    SELECT
      wds.account_key,
      wds.week_start,
      COALESCE(SUM(
        CASE WHEN tt.action_category = 'TRANSFER'
        THEN ft.net_amount
        ELSE 0 END
      ), 0) as cumulative_transfers
    FROM weekly_date_series wds
    LEFT JOIN ${factTransaction} ft ON ft.account_key = wds.account_key
    LEFT JOIN ${dimDate} d ON ft.date_key = d.date_key
    LEFT JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.week_starting_date <= wds.week_start OR ft.transaction_key IS NULL
    GROUP BY wds.account_key, wds.week_start
  )

  SELECT
    wcf.account_key,
    wcf.week_start,
    wcf.cash_flows_to_date as cash_flows,

    -- Stock position values from weekly positions (use premium cost basis)
    COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM ${viewWeeklyPosition} vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'STOCK'
       AND vwp.position_status = 'OPEN'), 0
    ) as stock_position_value,

    -- Option collateral values using strike_price * 100 (matching viewPosition logic)
    COALESCE(
      (SELECT SUM(ds.strike_price * ABS(vwp.quantity) * 100)
       FROM ${viewWeeklyPosition} vwp
       JOIN ${dimSecurity} ds ON vwp.symbol = ds.symbol
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'OPTION'
       AND vwp.position_status = 'OPEN'), 0
    ) as option_collateral_value,

    -- Cumulative transfers
    wt.cumulative_transfers,

    -- Total portfolio value = cash flows + stock position values
    wcf.cash_flows_to_date + COALESCE(
      (SELECT SUM(vwp.position_value)
       FROM ${viewWeeklyPosition} vwp
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'STOCK'
       AND vwp.position_status = 'OPEN'), 0
    ) as total_portfolio_value,

    -- Available cash = cash flows - option collateral
    wcf.cash_flows_to_date - COALESCE(
      (SELECT SUM(ds.strike_price * ABS(vwp.quantity) * 100)
       FROM ${viewWeeklyPosition} vwp
       JOIN ${dimSecurity} ds ON vwp.symbol = ds.symbol
       WHERE vwp.account_key = wcf.account_key
       AND vwp.week_start = wcf.week_start
       AND vwp.security_type = 'OPTION'
       AND vwp.position_status = 'OPEN'), 0
    ) as available_cash

  FROM weekly_cash_flows wcf
  JOIN weekly_transfers wt ON wcf.account_key = wt.account_key
    AND wcf.week_start = wt.week_start
  ORDER BY wcf.account_key, wcf.week_start
`);

// Current Portfolio Value View - Shows current portfolio value from latest week
export const viewCurrentPortfolioValue = pgView(
  "view_current_portfolio_value",
  {
    accountKey: integer("account_key"),
    cashFlows: decimal("cash_flows", { precision: 18, scale: 8 }),
    stockPositionValue: decimal("stock_position_value", {
      precision: 18,
      scale: 8,
    }),
    optionCollateralValue: decimal("option_collateral_value", {
      precision: 18,
      scale: 8,
    }),
    cumulativeTransfers: decimal("cumulative_transfers", {
      precision: 18,
      scale: 8,
    }),
    totalPortfolioValue: decimal("total_portfolio_value", {
      precision: 18,
      scale: 8,
    }),
    availableCash: decimal("available_cash", { precision: 18, scale: 8 }),
  },
).with({
  securityInvoker: true,
}).as(sql`
  SELECT
    account_key,
    cash_flows,
    stock_position_value,
    option_collateral_value,
    cumulative_transfers,
    total_portfolio_value,
    available_cash
  FROM ${viewWeeklyPortfolioValue}
  WHERE week_start = (SELECT MAX(week_start) FROM ${viewWeeklyPortfolioValue})
`);

// Portfolio Distribution (Your dashboard pie chart)
export const viewPortfolioDistribution = pgView("view_portfolio_distribution", {
  accountKey: integer("account_key"),
  symbol: varchar("symbol", { length: 50 }),
  positionValue: decimal("position_value", { precision: 18, scale: 8 }),
  instrumentCount: integer("instrument_count"),
  portfolioPercentage: decimal("portfolio_percentage", {
    precision: 10,
    scale: 4,
  }),
}).with({
  securityInvoker: true,
}).as(sql`
  SELECT
    account_key,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY account_key)) * 100 as portfolio_percentage

  FROM ${viewCurrentPosition}
  WHERE position_status = 'OPEN'
  GROUP BY account_key, underlying_symbol
  ORDER BY ABS(SUM(position_value)) DESC
`);

// Weekly Returns Chart
export const viewWeeklyReturn = pgView("view_weekly_return", {
  accountKey: integer("account_key"),
  weekStart: date("week_start"),
  cumulativePortfolioValue: decimal("cumulative_portfolio_value", {
    precision: 18,
    scale: 8,
  }),
  cumulativeTransfers: decimal("cumulative_transfers", {
    precision: 18,
    scale: 8,
  }),
  weeklyReturnPercent: decimal("weekly_return_percent", {
    precision: 10,
    scale: 4,
  }),
  weeklyReturnAbsolute: decimal("weekly_return_absolute", {
    precision: 18,
    scale: 8,
  }),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH weekly_transfers AS (
    -- Calculate weekly transfers separately for returns calculation
    SELECT
      a.account_key,
      d.week_starting_date as week_start,
      SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
      SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
    FROM ${factTransaction} ft
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE d.full_date <= CURRENT_DATE
    GROUP BY a.account_key, d.week_starting_date
  ),

  portfolio_with_transfers AS (
    -- Combine portfolio values with transfer data
    SELECT
      wpv.account_key,
      wpv.week_start,
      wpv.total_portfolio_value as cumulative_portfolio_value,
      wpv.cumulative_transfers,
      COALESCE(wt.weekly_transfers, 0) as weekly_transfers,
      COALESCE(wt.weekly_gains, 0) as weekly_gains
    FROM ${viewWeeklyPortfolioValue} wpv
    LEFT JOIN weekly_transfers wt ON wpv.account_key = wt.account_key
      AND wpv.week_start = wt.week_start
  ),

  returns_calculation AS (
    SELECT
      account_key,
      week_start,
      cumulative_portfolio_value,
      cumulative_transfers,
      weekly_transfers,
      weekly_gains as weekly_return_absolute,
      -- LAG calculation for previous week's portfolio value
      LAG(cumulative_portfolio_value, 1) OVER (
        PARTITION BY account_key
        ORDER BY week_start
      ) as prev_week_portfolio_value
    FROM portfolio_with_transfers
  )

  SELECT
    account_key,
    week_start,
    cumulative_portfolio_value,
    cumulative_transfers,
    weekly_return_absolute,
    -- Weekly return calculation: handle first week properly
    CASE
      WHEN prev_week_portfolio_value > 0 THEN
        -- Normal case: previous week portfolio value exists
        ((cumulative_portfolio_value - weekly_transfers - prev_week_portfolio_value)
          / prev_week_portfolio_value) * 100
      WHEN prev_week_portfolio_value IS NULL AND cumulative_transfers > 0 THEN
        -- First week case: use weekly gains relative to transfers
        (weekly_return_absolute / cumulative_transfers) * 100
      ELSE NULL
    END as weekly_return_percent
  FROM returns_calculation
  ORDER BY account_key, week_start
`);

// Profit Distribution View - Shows profit/loss distribution by underlying symbol for pie chart
export const viewProfitDistribution = pgView("view_profit_distribution", {
  accountKey: integer("account_key"),
  underlyingSymbol: varchar("underlying_symbol", { length: 50 }),
  totalProfit: decimal("total_profit", { precision: 18, scale: 8 }),
  tradeCount: integer("trade_count"),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH stock_positions AS (
    -- Calculate net stock positions to identify completed vs open trades
    SELECT
      ft.account_key,
      s.underlying_symbol,
      s.symbol,
      SUM(ft.quantity) as net_quantity,
      SUM(ft.net_amount) as total_net_amount
    FROM ${factTransaction} ft
    JOIN ${dimSecurity} s ON ft.security_key = s.security_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE tt.action_category = 'TRADE' AND s.security_type = 'STOCK'
    GROUP BY ft.account_key, s.underlying_symbol, s.symbol
  )
  SELECT
    a.account_key,
    s.underlying_symbol,
    SUM(CASE
        -- For options: include all net amounts (premiums received/paid)
        WHEN s.security_type != 'STOCK' THEN ft.net_amount
        -- For stocks: only include profits from closed positions (net_quantity = 0)
        WHEN s.security_type = 'STOCK' AND sp.net_quantity = 0 THEN ft.net_amount
        ELSE 0
    END) as total_profit,
    COUNT(CASE
        WHEN s.security_type != 'STOCK' THEN 1
        WHEN s.security_type = 'STOCK' AND sp.net_quantity = 0 THEN 1
        ELSE NULL
    END)::integer as trade_count
  FROM ${factTransaction} ft
  JOIN ${dimSecurity} s ON ft.security_key = s.security_key
  JOIN ${dimAccount} a ON ft.account_key = a.account_key
  JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
  LEFT JOIN stock_positions sp ON ft.account_key = sp.account_key
    AND s.symbol = sp.symbol
    AND s.security_type = 'STOCK'
  WHERE tt.action_category = 'TRADE'
  GROUP BY a.account_key, s.underlying_symbol
  HAVING SUM(CASE
      WHEN s.security_type != 'STOCK' THEN ft.net_amount
      WHEN s.security_type = 'STOCK' AND sp.net_quantity = 0 THEN ft.net_amount
      ELSE 0
  END) != 0
  ORDER BY SUM(CASE
      WHEN s.security_type != 'STOCK' THEN ft.net_amount
      WHEN s.security_type = 'STOCK' AND sp.net_quantity = 0 THEN ft.net_amount
      ELSE 0
  END) DESC
`);

// Portfolio Summary View - Aggregates key portfolio metrics for dashboard
export const viewPortfolioSummary = pgView("view_portfolio_summary", {
  accountKey: integer("account_key"),
  portfolioValue: decimal("portfolio_value", {
    precision: 18,
    scale: 8,
  }).default("0"),
  cashBalance: decimal("cash_balance", { precision: 18, scale: 8 }).default(
    "0",
  ),
  availableCash: decimal("available_cash", { precision: 18, scale: 8 }).default(
    "0",
  ),
  stockPositionValue: decimal("stock_position_value", {
    precision: 18,
    scale: 8,
  }).default("0"),
  optionCollateralValue: decimal("option_collateral_value", {
    precision: 18,
    scale: 8,
  }).default("0"),
  monthlyPnl: decimal("monthly_pnl", { precision: 18, scale: 8 }).default("0"),
  yearlyPnl: decimal("yearly_pnl", { precision: 18, scale: 8 }).default("0"),
  monthlyPnlPercent: decimal("monthly_pnl_percent", {
    precision: 10,
    scale: 4,
  }).default("0"),
  yearlyPnlPercent: decimal("yearly_pnl_percent", {
    precision: 10,
    scale: 4,
  }).default("0"),
  overallPercentIncrease: decimal("overall_percent_increase", {
    precision: 10,
    scale: 4,
  }).default("0"),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH realised_monthly_pnl AS (
    -- Realised P/L for current month including stock position adjustments
    -- Note: Stock purchases show as negative cash flow but create equivalent asset value
    -- This calculation accounts for both to show true realized P&L from trading
    SELECT
      a.account_key,
      -- Raw cash flows from trades and income this month
      SUM(ft.net_amount) + COALESCE(
        -- Add back stock position values for trades that happened this month
        -- This prevents stock purchases from appearing as "losses" in P&L
        (SELECT SUM(vwp.position_value)
         FROM ${viewWeeklyPosition} vwp
         WHERE vwp.account_key = a.account_key
         AND vwp.position_status = 'OPEN'
         AND vwp.security_type = 'STOCK'
         AND DATE_TRUNC('month', vwp.first_transaction_date) = DATE_TRUNC('month', CURRENT_DATE)
         AND vwp.week_start = (SELECT MAX(week_start) FROM ${viewWeeklyPosition} WHERE account_key = a.account_key)), 0
      ) as monthly_realised_pnl
    FROM ${factTransaction} ft
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
      AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  realised_yearly_pnl AS (
    -- Realised P/L for current year including stock position adjustments
    -- Note: Stock purchases show as negative cash flow but create equivalent asset value
    -- This calculation accounts for both to show true realized P&L from trading
    SELECT
      a.account_key,
      -- Raw cash flows from trades and income this year
      SUM(ft.net_amount) + COALESCE(
        -- Add back stock position values for trades that happened this year
        -- This prevents stock purchases from appearing as "losses" in P&L
        (SELECT SUM(vwp.position_value)
         FROM ${viewWeeklyPosition} vwp
         WHERE vwp.account_key = a.account_key
         AND vwp.position_status = 'OPEN'
         AND vwp.security_type = 'STOCK'
         AND EXTRACT(YEAR FROM vwp.first_transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND vwp.week_start = (SELECT MAX(week_start) FROM ${viewWeeklyPosition} WHERE account_key = a.account_key)), 0
      ) as yearly_realised_pnl
    FROM ${factTransaction} ft
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category IN ('TRADE', 'INCOME')
      AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY a.account_key
  ),

  total_transfers_calc AS (
    -- Calculate total transfers (money deposited/withdrawn)
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_transfers
    FROM ${factTransaction} ft
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category = 'TRANSFER'
    GROUP BY a.account_key
  ),

  portfolio_value_start_of_month AS (
    -- Calculate portfolio value at start of month using viewWeeklyPortfolioValue
    SELECT
      wpv.account_key,
      wpv.total_portfolio_value as portfolio_value_start_month
    FROM ${viewWeeklyPortfolioValue} wpv
    WHERE wpv.week_start = (
      SELECT MAX(week_start)
      FROM ${viewWeeklyPortfolioValue} wpv2
      WHERE wpv2.account_key = wpv.account_key
      AND wpv2.week_start < DATE_TRUNC('month', CURRENT_DATE)
    )
  ),

  portfolio_value_start_of_year AS (
    -- Calculate portfolio value at start of year using viewWeeklyPortfolioValue
    SELECT
      wpv.account_key,
      wpv.total_portfolio_value as portfolio_value_start_year
    FROM ${viewWeeklyPortfolioValue} wpv
    WHERE wpv.week_start = (
      SELECT MAX(week_start)
      FROM ${viewWeeklyPortfolioValue} wpv2
      WHERE wpv2.account_key = wpv.account_key
      AND wpv2.week_start < DATE_TRUNC('year', CURRENT_DATE)
    )
  )

  -- Final summary query using viewWeeklyPortfolioValue
  SELECT
    a.account_key,
    COALESCE(pv.total_portfolio_value, 0) as portfolio_value,
    COALESCE(pv.cash_flows, 0) as cash_balance,
    COALESCE(pv.available_cash, 0) as available_cash,
    COALESCE(pv.stock_position_value, 0) as stock_position_value,
    COALESCE(pv.option_collateral_value, 0) as option_collateral_value,
    COALESCE(mp.monthly_realised_pnl, 0) as monthly_pnl,
    COALESCE(yp.yearly_realised_pnl, 0) as yearly_pnl,

    -- Calculate percentage changes based on realized P&L vs portfolio value
    CASE
      WHEN COALESCE(pvsm.portfolio_value_start_month, 0) > 0
      THEN (COALESCE(mp.monthly_realised_pnl, 0) / pvsm.portfolio_value_start_month * 100)
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as monthly_pnl_percent,

    CASE
      WHEN COALESCE(pvsy.portfolio_value_start_year, 0) > 0
      THEN (COALESCE(yp.yearly_realised_pnl, 0) / pvsy.portfolio_value_start_year * 100)
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as yearly_pnl_percent,

    CASE
      WHEN COALESCE(pv.cumulative_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(pv.cumulative_transfers, 0)) / pv.cumulative_transfers * 100)
      ELSE 0
    END as overall_percent_increase

  FROM ${dimAccount} a
  LEFT JOIN ${viewCurrentPortfolioValue} pv ON a.account_key = pv.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN total_transfers_calc tt ON a.account_key = tt.account_key
  LEFT JOIN portfolio_value_start_of_month pvsm ON a.account_key = pvsm.account_key
  LEFT JOIN portfolio_value_start_of_year pvsy ON a.account_key = pvsy.account_key
  WHERE a.is_active = true
`);

// Daily Trading Activity Heatmap View - Shows daily trading activity with expiry information
export const viewDailyActivity = pgView("view_daily_activity", {
  accountKey: integer("account_key"),
  date: date("date"),
  tradeCount: integer("trade_count"),
  dailyPremium: decimal("daily_premium", { precision: 18, scale: 8 }),
  dailyReturnPercent: decimal("daily_return_percent", {
    precision: 10,
    scale: 4,
  }),
  expiringContracts: integer("expiring_contracts"),
  expiringSymbols: text("expiring_symbols"),
  isCurrentDate: boolean("is_current_date"),
}).with({
  securityInvoker: true,
}).as(sql`
  WITH expiry_range AS (
    -- Find the furthest expiry date to determine our window
    SELECT
        a.account_key,
        COALESCE(MAX(s.expiry_date), CURRENT_DATE) as max_expiry_date
    FROM ${dimAccount} a
    LEFT JOIN ${viewCurrentPosition} vp ON a.account_key = vp.account_key
    LEFT JOIN ${dimSecurity} s ON s.symbol = vp.symbol AND s.expiry_date IS NOT NULL AND s.expiry_date >= CURRENT_DATE AND ABS(CAST(vp.quantity AS DECIMAL)) > 0
    WHERE a.is_active = true
    GROUP BY a.account_key
  ),
  all_weekdays AS (
    SELECT d.full_date, er.account_key
    FROM ${dimDate} d, expiry_range er
    WHERE d.full_date >= CURRENT_DATE - INTERVAL '6 months'
      AND d.full_date <= er.max_expiry_date
      AND EXTRACT(dow FROM d.full_date) BETWEEN 1 AND 5
  ),
  stock_positions AS (
    -- Calculate net stock positions to identify completed vs open trades
    SELECT
      ft.account_key,
      s.underlying_symbol,
      s.symbol,
      SUM(ft.quantity) as net_quantity
    FROM ${factTransaction} ft
    JOIN ${dimSecurity} s ON ft.security_key = s.security_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE tt.action_category = 'TRADE' AND s.security_type = 'STOCK'
    GROUP BY ft.account_key, s.underlying_symbol, s.symbol
  ),
  daily_data AS (
    SELECT
        d.full_date,
        d.week_starting_date,
        a.account_key,
        SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as daily_transfers,
        -- Use same stock logic as profit distribution: exclude open stock positions, include closed ones
        SUM(CASE
            WHEN tt.action_category NOT IN ('TRANSFER') AND ds.security_type != 'STOCK'
            THEN ft.net_amount
            WHEN tt.action_category NOT IN ('TRANSFER') AND ds.security_type = 'STOCK' AND sp.net_quantity = 0
            THEN ft.net_amount
            ELSE 0
        END) as daily_gains,
        COUNT(CASE WHEN tt.action_category = 'TRADE' THEN ft.transaction_key END) as trade_count
    FROM ${factTransaction} ft
    JOIN ${dimDate} d ON ft.date_key = d.date_key
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    JOIN ${dimSecurity} ds ON ft.security_key = ds.security_key
    LEFT JOIN stock_positions sp ON ft.account_key = sp.account_key
      AND ds.symbol = sp.symbol
      AND ds.security_type = 'STOCK'
    WHERE d.full_date <= CURRENT_DATE
      AND d.full_date >= CURRENT_DATE - INTERVAL '6 months'
      AND EXTRACT(dow FROM d.full_date) BETWEEN 1 AND 5
    GROUP BY a.account_key, d.full_date, d.week_starting_date
  ),
  -- Get weekly portfolio values using corrected stock position handling
  weekly_portfolio_data AS (
    SELECT
        account_key,
        week_start,
        total_portfolio_value,
        LAG(total_portfolio_value) OVER (PARTITION BY account_key ORDER BY week_start) as previous_week_portfolio_value
    FROM ${viewWeeklyPortfolioValue}
    WHERE week_start >= (CURRENT_DATE - INTERVAL '6 months')::date
  ),
  daily_returns AS (
    SELECT
        dd.account_key,
        dd.full_date,
        dd.trade_count,
        dd.daily_gains as daily_premium,
        -- Use weekly portfolio values for percentage calculation
        CASE
            WHEN wpd.previous_week_portfolio_value IS NOT NULL AND wpd.previous_week_portfolio_value != 0
            THEN ROUND((dd.daily_gains / ABS(wpd.previous_week_portfolio_value)) * 100, 2)
            ELSE 0
        END as daily_return_percent
    FROM daily_data dd
    LEFT JOIN weekly_portfolio_data wpd ON dd.account_key = wpd.account_key
      AND dd.week_starting_date = wpd.week_start
  ),
  daily_expiries AS (
    SELECT
        s.expiry_date as full_date,
        vp.account_key,
        COUNT(*) as expiring_contracts,
        STRING_AGG(DISTINCT s.underlying_symbol, ', ') as expiring_symbols
    FROM ${viewCurrentPosition} vp
    JOIN ${dimSecurity} s ON s.symbol = vp.symbol
    WHERE s.expiry_date IS NOT NULL
      AND s.expiry_date >= CURRENT_DATE
      AND ABS(CAST(vp.quantity AS DECIMAL)) > 0
      AND EXTRACT(dow FROM s.expiry_date) BETWEEN 1 AND 5
    GROUP BY s.expiry_date, vp.account_key
  )
  SELECT
      wd.account_key,
      wd.full_date as date,
      COALESCE(dr.trade_count, 0) as trade_count,
      COALESCE(dr.daily_premium, 0) as daily_premium,
      COALESCE(dr.daily_return_percent, 0) as daily_return_percent,
      COALESCE(de.expiring_contracts, 0) as expiring_contracts,
      de.expiring_symbols,
      (wd.full_date = CURRENT_DATE) as is_current_date
  FROM all_weekdays wd
  LEFT JOIN daily_returns dr ON wd.full_date = dr.full_date AND wd.account_key = dr.account_key
  LEFT JOIN daily_expiries de ON wd.full_date = de.full_date AND wd.account_key = de.account_key
  ORDER BY wd.account_key, date DESC
`);

// =============================================
// RELATIONS (for Drizzle ORM)
// =============================================

export const stgTransactionRelations = relations(stgTransaction, ({ one }) => ({
  account: one(dimAccount, {
    fields: [stgTransaction.accountKey],
    references: [dimAccount.accountKey],
  }),
}));

export const dimUserRelations = relations(dimUser, ({ many }) => ({
  accounts: many(dimAccount),
}));

export const dimAccountAccessTokenRelations = relations(
  dimAccountAccessToken,
  ({ one }) => ({
    account: one(dimAccount, {
      fields: [dimAccountAccessToken.accountKey],
      references: [dimAccount.accountKey],
    }),
    broker: one(dimBroker, {
      fields: [dimAccountAccessToken.brokerCode],
      references: [dimBroker.brokerCode],
    }),
  }),
);

export const dimAccountRelations = relations(dimAccount, ({ one, many }) => ({
  user: one(dimUser, {
    fields: [dimAccount.userId],
    references: [dimUser.id],
  }),
  transactions: many(factTransaction),
  brokerAccounts: many(dimBrokerAccount),
  accessTokens: many(dimAccountAccessToken),
}));

export const dimBrokerRelations = relations(dimBroker, ({ many }) => ({
  brokerAccounts: many(dimBrokerAccount),
  transactions: many(factTransaction),
}));

export const dimBrokerAccountRelations = relations(
  dimBrokerAccount,
  ({ one }) => ({
    account: one(dimAccount, {
      fields: [dimBrokerAccount.accountKey],
      references: [dimAccount.accountKey],
    }),
    broker: one(dimBroker, {
      fields: [dimBrokerAccount.brokerKey],
      references: [dimBroker.brokerKey],
    }),
  }),
);

export const factTransactionRelations = relations(
  factTransaction,
  ({ one }) => ({
    date: one(dimDate, {
      fields: [factTransaction.dateKey],
      references: [dimDate.dateKey],
    }),
    time: one(dimTime, {
      fields: [factTransaction.timeKey],
      references: [dimTime.timeKey],
    }),
    account: one(dimAccount, {
      fields: [factTransaction.accountKey],
      references: [dimAccount.accountKey],
    }),
    transactionType: one(dimTransactionType, {
      fields: [factTransaction.transactionTypeKey],
      references: [dimTransactionType.transactionTypeKey],
    }),
    broker: one(dimBroker, {
      fields: [factTransaction.brokerKey],
      references: [dimBroker.brokerKey],
    }),
    security: one(dimSecurity, {
      fields: [factTransaction.securityKey],
      references: [dimSecurity.securityKey],
    }),
  }),
);

// =============================================
// TYPE EXPORTS
// =============================================

export type ITransactionAction =
  | "buy"
  | "sell"
  | "buy_to_open"
  | "sell_to_close"
  | "sell_to_open"
  | "buy_to_close"
  | "expire"
  | "assign"
  | "dividend"
  | "interest"
  | "transfer"
  | "other";

export type RtmSyncProgress = typeof rtmSyncProgress.$inferSelect;
export type NewRtmSyncProgress = typeof rtmSyncProgress.$inferInsert;

export type StgTransaction = typeof stgTransaction.$inferSelect;
export type NewStgTransaction = typeof stgTransaction.$inferInsert;

export type DimUser = typeof dimUser.$inferSelect;
export type NewDimUser = typeof dimUser.$inferInsert;

export type DimAccountAccessToken = typeof dimAccountAccessToken.$inferSelect;
export type NewDimAccountAccessToken =
  typeof dimAccountAccessToken.$inferInsert;

export type DimDate = typeof dimDate.$inferSelect;
export type DimTime = typeof dimTime.$inferSelect;
export type DimSecurity = typeof dimSecurity.$inferSelect;
export type DimTransactionType = typeof dimTransactionType.$inferSelect;
export type DimAccount = typeof dimAccount.$inferSelect;
export type DimBroker = typeof dimBroker.$inferSelect;

export type DimBrokerAccount = typeof dimBrokerAccount.$inferSelect;
export type NewDimBrokerAccount = typeof dimBrokerAccount.$inferInsert;

export type FactTransaction = typeof factTransaction.$inferSelect;
export type NewFactTransaction = typeof factTransaction.$inferInsert;

export type FactStockPrices = typeof factStockPrices.$inferSelect;
export type NewFactStockPrices = typeof factStockPrices.$inferInsert;

export type ViewCurrentPosition = typeof viewCurrentPosition.$inferSelect;
export type ViewCurrentPortfolioValue =
  typeof viewCurrentPortfolioValue.$inferSelect;
export type ViewPortfolioDistribution =
  typeof viewPortfolioDistribution.$inferSelect;
export type ViewWeeklyReturn = typeof viewWeeklyReturn.$inferSelect;
export type ViewProfitDistribution = typeof viewProfitDistribution.$inferSelect;
export type ViewPortfolioSummary = typeof viewPortfolioSummary.$inferSelect;
export type ViewDailyActivity = typeof viewDailyActivity.$inferSelect;
