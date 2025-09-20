import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  decimal,
  foreignKey,
  index,
  integer,
  json,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// =============================================
// STAGING TABLES
// =============================================

export const stgTransaction = pgTable(
  "stg_transaction",
  {
    id: serial("id").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey),
    brokerCode: varchar("broker_code", { length: 20 }).notNull(),
    brokerTransactionId: varchar("broker_transaction_id", {
      length: 50,
    }).notNull(),

    // Raw broker data
    rawData: json("raw_data").notNull(),

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
      table.brokerCode
    ),
    index("idx_stg_transaction_account_status").on(
      table.accountKey,
      table.status
    ),
    index("idx_stg_transaction_broker_id").on(table.brokerTransactionId),
  ]
);

// =============================================
// DIMENSIONAL TABLES
// =============================================

// User Dimension - Represents a user of the application
export const dimUser = pgTable("dim_user", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Account Dimension - Represents an account of a user
export const dimAccount = pgTable("dim_account", {
  accountKey: serial("account_key").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => dimUser.id),
  accountName: varchar("account_name", { length: 100 }).default(
    "Primary Account"
  ),
  accountType: varchar("account_type", { length: 50 }).default("INDIVIDUAL"), // INDIVIDUAL, JOINT, CORPORATE, IRA, ROTH, 401K, 403B, 529, OTHER
  currency: varchar("currency", { length: 3 }).default("USD"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Account Access Token Dimension
export const dimAccountAccessToken = pgTable(
  "dim_account_access_token",
  {
    accessTokenKey: serial("access_token_key").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey),
    encryptedTokens: text("encrypted_tokens").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    tokenType: varchar("token_type", { length: 50 }).notNull(),
    scope: varchar("scope", { length: 255 }).notNull(),
    brokerCode: varchar("broker_code", { length: 20 })
      .notNull()
      .references(() => dimBroker.brokerCode),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_account_broker_token").on(
      table.accountKey,
      table.brokerCode
    ),
  ]
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
  ]
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
  `
    ),
  ]
);

// Transaction Type Dimension
export const dimTransactionType = pgTable("dim_transaction_type", {
  transactionTypeKey: serial("transaction_type_key").primaryKey(),
  actionCode: varchar("action_code", { length: 20 }).notNull().unique(),
  actionDescription: varchar("action_description", { length: 100 }),
  actionCategory: varchar("action_category", { length: 50 }), // 'TRADE', 'INCOME', 'TRANSFER', 'CORPORATE'
  affectsPosition: boolean("affects_position"),
  direction: integer("direction"), // +1 for inflows, -1 for outflows, 0 for neutral
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Broker Dimension
export const dimBroker = pgTable("dim_broker", {
  brokerKey: serial("broker_key").primaryKey(),
  brokerCode: varchar("broker_code", { length: 20 }).notNull().unique(),
  brokerName: varchar("broker_name", { length: 100 }),
  commissionStructure: varchar("commission_structure", { length: 100 }),
  apiProvider: varchar("api_provider", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Broker Account Dimension - Maps broker accounts to user accounts
export const dimBrokerAccount = pgTable(
  "dim_broker_account",
  {
    brokerAccountKey: serial("broker_account_key").primaryKey(),
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey),
    brokerKey: integer("broker_key")
      .notNull()
      .references(() => dimBroker.brokerKey),
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
      table.brokerAccountNumber
    ),
    index("idx_broker_account_account_broker").on(
      table.accountKey,
      table.brokerKey
    ),
    index("idx_broker_account_hash").on(table.brokerAccountHash),
  ]
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
    accountKey: integer("account_key")
      .notNull()
      .references(() => dimAccount.accountKey),
    securityKey: integer("security_key").references(
      () => dimSecurity.securityKey
    ),
    transactionTypeKey: integer("transaction_type_key")
      .notNull()
      .references(() => dimTransactionType.transactionTypeKey),
    brokerKey: integer("broker_key")
      .notNull()
      .references(() => dimBroker.brokerKey),

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
      table.originalTransactionId
    ),

    // Performance indexes
    index("idx_fact_transaction_date").on(table.dateKey),
    index("idx_fact_transaction_account").on(table.accountKey),
    index("idx_fact_transaction_security").on(table.securityKey),
  ]
);

// =============================================
// ANALYTICAL VIEWS
// =============================================

// Simplified positions view based purely on transaction aggregation
export const viewPosition = pgView("view_position", {
  accountKey: integer("account_key"),
  symbol: varchar("symbol", { length: 50 }),
  underlyingSymbol: varchar("underlying_symbol", { length: 50 }),
  securityType: varchar("security_type", { length: 20 }),
  optionType: varchar("option_type", { length: 10 }),
  strikePrice: decimal("strike_price", { precision: 18, scale: 8 }),
  quantityHeld: decimal("quantity_held", { precision: 18, scale: 8 }),
  positionValue: decimal("position_value", { precision: 18, scale: 8 }),
  netPositionValue: decimal("net_position_value", { precision: 18, scale: 8 }),
  averagePrice: decimal("average_price", { precision: 18, scale: 8 }),
  totalFees: decimal("total_fees", { precision: 18, scale: 8 }),
  daysToExpiry: integer("days_to_expiry"),
  positionStatus: varchar("position_status", { length: 10 }),
  firstTransactionDate: date("first_transaction_date"),
  lastTransactionDate: date("last_transaction_date"),
  transactionCount: integer("transaction_count"),
  expiryDate: date("expiry_date"),
}).as(sql`
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

  FROM ${factTransaction} ft
  JOIN ${dimSecurity} s ON ft.security_key = s.security_key
  JOIN ${dimAccount} a ON ft.account_key = a.account_key
  JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
  JOIN ${dimDate} d ON ft.date_key = d.date_key
  WHERE tt.action_category IN ('TRADE', 'CORPORATE')
  GROUP BY a.account_key, s.symbol, s.underlying_symbol, s.strike_price
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
}).as(sql`
  SELECT
    account_key,
    underlying_symbol as symbol,
    SUM(position_value) as position_value,
    COUNT(*)::integer as instrument_count,
    (ABS(SUM(position_value)) / SUM(ABS(SUM(position_value))) OVER (PARTITION BY account_key)) * 100 as portfolio_percentage

  FROM ${viewPosition}
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
}).as(sql`
  WITH weekly_data AS (
      SELECT
          a.account_key,
          d.week_starting_date as week_start,
          -- Weekly transfers (money wire in/out)
          SUM(CASE WHEN tt.action_category = 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_transfers,
          -- Weekly gains/losses from trading, dividends, and interest (NOT including transfers)
          SUM(CASE WHEN tt.action_category != 'TRANSFER' THEN ft.net_amount ELSE 0 END) as weekly_gains
      FROM ${factTransaction} ft
      JOIN ${dimDate} d ON ft.date_key = d.date_key
      JOIN ${dimAccount} a ON ft.account_key = a.account_key
      JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
      WHERE d.full_date <= CURRENT_DATE
      GROUP BY a.account_key, d.week_starting_date
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
`);

// Portfolio Summary View - Aggregates key portfolio metrics for dashboard
export const viewPortfolioSummary = pgView("view_portfolio_summary", {
  accountKey: integer("account_key"),
  portfolioValue: decimal("portfolio_value", {
    precision: 18,
    scale: 8,
  }).default("0"),
  cashBalance: decimal("cash_balance", { precision: 18, scale: 8 }).default(
    "0"
  ),
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
}).as(sql`
  WITH portfolio_value_calc AS (
    -- Calculate total portfolio value from all transaction flows
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_portfolio_value
    FROM ${factTransaction} ft
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    GROUP BY a.account_key
  ),

  position_values_calc AS (
    -- Current invested amount (position value of held positions)
    -- Note: position_value can be negative for short positions, positive for long positions
    SELECT
      account_key,
      SUM(position_value) as total_position_value
    FROM ${viewPosition}
    WHERE position_status = 'OPEN'
    GROUP BY account_key
  ),

  realised_monthly_pnl AS (
    -- Realised P/L for current month
    SELECT
      a.account_key,
      SUM(ft.net_amount) as monthly_realised_pnl
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
    -- Realised P/L for current year
    SELECT
      a.account_key,
      SUM(ft.net_amount) as yearly_realised_pnl
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
    -- Calculate total transfers (money deposited/withdrawn) to determine initial investment
    SELECT
      a.account_key,
      SUM(ft.net_amount) as total_transfers
    FROM ${factTransaction} ft
    JOIN ${dimAccount} a ON ft.account_key = a.account_key
    JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
    WHERE
      tt.action_category = 'TRANSFER'
    GROUP BY a.account_key
  )

  -- Final summary query
  SELECT
    a.account_key,
    COALESCE(pv.total_portfolio_value, 0) as portfolio_value,
    COALESCE(pv.total_portfolio_value - COALESCE(pvs.total_position_value, 0), pv.total_portfolio_value, 0) as cash_balance,
    COALESCE(mp.monthly_realised_pnl, 0) as monthly_pnl,
    COALESCE(yp.yearly_realised_pnl, 0) as yearly_pnl,
    COALESCE(tt.total_transfers, 0) as total_transfers,

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
      WHEN COALESCE(tt.total_transfers, 0) > 0
      THEN ((COALESCE(pv.total_portfolio_value, 0) - COALESCE(tt.total_transfers, 0)) / tt.total_transfers * 100)
      ELSE 0
    END as overall_percent_increase

  FROM ${dimAccount} a
  LEFT JOIN portfolio_value_calc pv ON a.account_key = pv.account_key
  LEFT JOIN position_values_calc pvs ON a.account_key = pvs.account_key
  LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
  LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
  LEFT JOIN total_transfers_calc tt ON a.account_key = tt.account_key
  WHERE a.is_active = true
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
  })
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
  })
);

export const factTransactionRelations = relations(
  factTransaction,
  ({ one }) => ({
    date: one(dimDate, {
      fields: [factTransaction.dateKey],
      references: [dimDate.dateKey],
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
  })
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

export type StgTransaction = typeof stgTransaction.$inferSelect;
export type NewStgTransaction = typeof stgTransaction.$inferInsert;

export type DimUser = typeof dimUser.$inferSelect;
export type NewDimUser = typeof dimUser.$inferInsert;

export type DimAccountAccessToken = typeof dimAccountAccessToken.$inferSelect;
export type NewDimAccountAccessToken =
  typeof dimAccountAccessToken.$inferInsert;

export type DimDate = typeof dimDate.$inferSelect;
export type DimSecurity = typeof dimSecurity.$inferSelect;
export type DimTransactionType = typeof dimTransactionType.$inferSelect;
export type DimAccount = typeof dimAccount.$inferSelect;
export type DimBroker = typeof dimBroker.$inferSelect;

export type DimBrokerAccount = typeof dimBrokerAccount.$inferSelect;
export type NewDimBrokerAccount = typeof dimBrokerAccount.$inferInsert;

export type FactTransaction = typeof factTransaction.$inferSelect;
export type NewFactTransaction = typeof factTransaction.$inferInsert;

export type ViewPosition = typeof viewPosition.$inferSelect;
export type ViewPortfolioDistribution =
  typeof viewPortfolioDistribution.$inferSelect;
export type ViewWeeklyReturn = typeof viewWeeklyReturn.$inferSelect;
export type ViewPortfolioSummary = typeof viewPortfolioSummary.$inferSelect;
