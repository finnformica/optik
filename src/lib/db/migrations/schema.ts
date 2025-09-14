import {
  pgTable,
  unique,
  serial,
  varchar,
  text,
  timestamp,
  foreignKey,
  integer,
  boolean,
  index,
  check,
  numeric,
  date,
  json,
  pgView,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 100 }),
    email: varchar({ length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: varchar({ length: 20 }).default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [unique("users_email_unique").on(table.email)],
);

export const dimAccount = pgTable(
  "dim_account",
  {
    accountKey: serial("account_key").primaryKey().notNull(),
    userId: integer("user_id").notNull(),
    accountName: varchar("account_name", { length: 100 }).default(
      "Primary Account",
    ),
    accountType: varchar("account_type", { length: 50 }).default("INDIVIDUAL"),
    currency: varchar({ length: 3 }).default("USD"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "dim_account_user_id_users_id_fk",
    }),
  ],
);

export const dimSecurity = pgTable(
  "dim_security",
  {
    securityKey: serial("security_key").primaryKey().notNull(),
    symbol: varchar({ length: 50 }).notNull(),
    securityType: varchar("security_type", { length: 20 }).notNull(),
    optionType: varchar("option_type", { length: 10 }),
    strikePrice: numeric("strike_price", { precision: 18, scale: 8 }),
    expiryDate: date("expiry_date"),
    securityName: text("security_name"),
    underlyingSymbol: varchar("underlying_symbol", { length: 50 }).notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_dim_security_symbol").using(
      "btree",
      table.symbol.asc().nullsLast().op("text_ops"),
    ),
    index("idx_dim_security_type").using(
      "btree",
      table.securityType.asc().nullsLast().op("text_ops"),
    ),
    index("idx_dim_security_underlying").using(
      "btree",
      table.underlyingSymbol.asc().nullsLast().op("text_ops"),
    ),
    check(
      "check_stock_option",
      sql`(((security_type)::text = 'STOCK'::text) AND ((underlying_symbol)::text = (symbol)::text) AND (option_type IS NULL) AND (strike_price IS NULL) AND (expiry_date IS NULL)) OR (((security_type)::text = 'OPTION'::text) AND ((underlying_symbol)::text <> (symbol)::text) AND (option_type IS NOT NULL) AND (strike_price IS NOT NULL) AND (expiry_date IS NOT NULL))`,
    ),
  ],
);

export const dimDate = pgTable(
  "dim_date",
  {
    dateKey: integer("date_key").primaryKey().notNull(),
    fullDate: date("full_date").notNull(),
    dayOfWeek: varchar("day_of_week", { length: 10 }),
    dayOfMonth: integer("day_of_month"),
    weekOfYear: integer("week_of_year"),
    monthName: varchar("month_name", { length: 10 }),
    monthNumber: integer("month_number"),
    quarter: integer(),
    year: integer(),
    isWeekend: boolean("is_weekend"),
    isTradingDay: boolean("is_trading_day"),
    weekEndingDate: date("week_ending_date"),
    monthEndingDate: date("month_ending_date"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_dim_date_full_date").using(
      "btree",
      table.fullDate.asc().nullsLast().op("date_ops"),
    ),
    index("idx_dim_date_year_month").using(
      "btree",
      table.year.asc().nullsLast().op("int4_ops"),
      table.monthNumber.asc().nullsLast().op("int4_ops"),
    ),
    unique("dim_date_full_date_unique").on(table.fullDate),
  ],
);

export const dimTransactionType = pgTable(
  "dim_transaction_type",
  {
    transactionTypeKey: serial("transaction_type_key").primaryKey().notNull(),
    actionCode: varchar("action_code", { length: 20 }).notNull(),
    actionDescription: varchar("action_description", { length: 100 }),
    actionCategory: varchar("action_category", { length: 50 }),
    affectsPosition: boolean("affects_position"),
    direction: integer(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    unique("dim_transaction_type_action_code_unique").on(table.actionCode),
  ],
);

export const dimBroker = pgTable(
  "dim_broker",
  {
    brokerKey: serial("broker_key").primaryKey().notNull(),
    brokerCode: varchar("broker_code", { length: 20 }).notNull(),
    brokerName: varchar("broker_name", { length: 100 }),
    commissionStructure: varchar("commission_structure", { length: 100 }),
    apiProvider: varchar("api_provider", { length: 50 }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [unique("dim_broker_broker_code_unique").on(table.brokerCode)],
);

export const rawTransactions = pgTable(
  "raw_transactions",
  {
    id: serial().primaryKey().notNull(),
    userId: integer("user_id").notNull(),
    brokerCode: varchar("broker_code", { length: 20 }).notNull(),
    brokerTransactionId: varchar("broker_transaction_id", {
      length: 50,
    }).notNull(),
    rawData: json("raw_data").notNull(),
    status: varchar({ length: 20 }).default("PENDING").notNull(),
    errorMessage: text("error_message"),
    brokerTimestamp: timestamp("broker_timestamp", {
      mode: "string",
    }).notNull(),
    processedAt: timestamp("processed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_raw_transactions_broker_id").using(
      "btree",
      table.brokerTransactionId.asc().nullsLast().op("text_ops"),
    ),
    index("idx_raw_transactions_user_status").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.status.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "raw_transactions_user_id_users_id_fk",
    }),
    unique("unique_broker_transaction").on(
      table.brokerCode,
      table.brokerTransactionId,
    ),
  ],
);

export const factTransactions = pgTable(
  "fact_transactions",
  {
    dateKey: integer("date_key").notNull(),
    accountKey: integer("account_key").notNull(),
    securityKey: integer("security_key"),
    transactionTypeKey: integer("transaction_type_key").notNull(),
    brokerKey: integer("broker_key").notNull(),
    brokerTransactionId: varchar("broker_transaction_id", { length: 50 })
      .primaryKey()
      .notNull(),
    orderId: varchar("order_id", { length: 50 }),
    originalTransactionId: integer("original_transaction_id"),
    quantity: numeric({ precision: 18, scale: 8 }).notNull(),
    pricePerUnit: numeric("price_per_unit", { precision: 18, scale: 8 }),
    grossAmount: numeric("gross_amount", { precision: 18, scale: 8 }).notNull(),
    fees: numeric({ precision: 18, scale: 8 }).default("0").notNull(),
    netAmount: numeric("net_amount", { precision: 18, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    description: text(),
  },
  (table) => [
    index("idx_fact_transactions_account").using(
      "btree",
      table.accountKey.asc().nullsLast().op("int4_ops"),
    ),
    index("idx_fact_transactions_date").using(
      "btree",
      table.dateKey.asc().nullsLast().op("int4_ops"),
    ),
    index("idx_fact_transactions_security").using(
      "btree",
      table.securityKey.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.dateKey],
      foreignColumns: [dimDate.dateKey],
      name: "fact_transactions_date_key_dim_date_date_key_fk",
    }),
    foreignKey({
      columns: [table.accountKey],
      foreignColumns: [dimAccount.accountKey],
      name: "fact_transactions_account_key_dim_account_account_key_fk",
    }),
    foreignKey({
      columns: [table.securityKey],
      foreignColumns: [dimSecurity.securityKey],
      name: "fact_transactions_security_key_dim_security_security_key_fk",
    }),
    foreignKey({
      columns: [table.transactionTypeKey],
      foreignColumns: [dimTransactionType.transactionTypeKey],
      name: "fact_transactions_transaction_type_key_dim_transaction_type_tra",
    }),
    foreignKey({
      columns: [table.brokerKey],
      foreignColumns: [dimBroker.brokerKey],
      name: "fact_transactions_broker_key_dim_broker_broker_key_fk",
    }),
    foreignKey({
      columns: [table.securityKey],
      foreignColumns: [dimSecurity.securityKey],
      name: "fk_fact_transactions_security",
    }),
    unique("unique_transaction").on(
      table.brokerTransactionId,
      table.originalTransactionId,
    ),
  ],
);

export const dimBrokerAccounts = pgTable(
  "dim_broker_accounts",
  {
    brokerAccountKey: serial("broker_account_key").primaryKey().notNull(),
    accountKey: integer("account_key").notNull(),
    brokerKey: integer("broker_key").notNull(),
    brokerAccountNumber: varchar("broker_account_number", {
      length: 50,
    }).notNull(),
    brokerAccountHash: varchar("broker_account_hash", {
      length: 100,
    }).notNull(),
    brokerAccountType: varchar("broker_account_type", { length: 50 }),
    isActive: boolean("is_active").default(true),
    lastSyncedAt: timestamp("last_synced_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("idx_broker_accounts_account_broker").using(
      "btree",
      table.accountKey.asc().nullsLast().op("int4_ops"),
      table.brokerKey.asc().nullsLast().op("int4_ops"),
    ),
    index("idx_broker_accounts_hash").using(
      "btree",
      table.brokerAccountHash.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.accountKey],
      foreignColumns: [dimAccount.accountKey],
      name: "dim_broker_accounts_account_key_dim_account_account_key_fk",
    }),
    foreignKey({
      columns: [table.brokerKey],
      foreignColumns: [dimBroker.brokerKey],
      name: "dim_broker_accounts_broker_key_dim_broker_broker_key_fk",
    }),
    unique("unique_broker_account").on(
      table.accountKey,
      table.brokerKey,
      table.brokerAccountNumber,
    ),
  ],
);

export const userAccessTokens = pgTable(
  "user_access_tokens",
  {
    id: serial().primaryKey().notNull(),
    userId: integer("user_id").notNull(),
    encryptedTokens: text("encrypted_tokens").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    tokenType: varchar("token_type", { length: 50 }).notNull(),
    scope: varchar({ length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    brokerCode: varchar("broker_code", { length: 20 }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_access_tokens_user_id_users_id_fk",
    }),
    foreignKey({
      columns: [table.brokerCode],
      foreignColumns: [dimBroker.brokerCode],
      name: "user_access_tokens_broker_code_dim_broker_broker_code_fk",
    }),
    unique("unique_user_broker_token").on(table.userId, table.brokerCode),
  ],
);
export const viewWeeklyReturns = pgView("view_weekly_returns", {
  userId: integer("user_id"),
  weekStart: date("week_start"),
  cumulativePortfolioValue: numeric("cumulative_portfolio_value"),
  cumulativeTransfers: numeric("cumulative_transfers"),
  weeklyReturnPercent: numeric("weekly_return_percent"),
  weeklyReturnAbsolute: numeric("weekly_return_absolute"),
}).as(
  sql`WITH weekly_data AS ( SELECT a.user_id, d.week_ending_date AS week_start, sum( CASE WHEN tt.action_category::text = 'TRANSFER'::text THEN ft.net_amount ELSE 0::numeric END) AS weekly_transfers, sum( CASE WHEN tt.action_category::text <> 'TRANSFER'::text THEN ft.net_amount ELSE 0::numeric END) AS weekly_gains FROM fact_transactions ft JOIN dim_date d ON ft.date_key = d.date_key JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key WHERE d.full_date <= CURRENT_DATE GROUP BY a.user_id, d.week_ending_date ), cumulative_data AS ( SELECT weekly_data.user_id, weekly_data.week_start, weekly_data.weekly_transfers, weekly_data.weekly_gains, sum(weekly_data.weekly_transfers) OVER (PARTITION BY weekly_data.user_id ORDER BY weekly_data.week_start) AS cumulative_transfers, sum(weekly_data.weekly_transfers + weekly_data.weekly_gains) OVER (PARTITION BY weekly_data.user_id ORDER BY weekly_data.week_start) AS cumulative_portfolio_value FROM weekly_data ), lagged_data AS ( SELECT cumulative_data.user_id, cumulative_data.week_start, cumulative_data.weekly_gains, cumulative_data.weekly_transfers, cumulative_data.cumulative_portfolio_value, cumulative_data.cumulative_transfers, lag(cumulative_data.cumulative_portfolio_value, 1) OVER (PARTITION BY cumulative_data.user_id ORDER BY cumulative_data.week_start) AS prev_week_portfolio_value FROM cumulative_data ), returns_calculation AS ( SELECT lagged_data.user_id, lagged_data.week_start, lagged_data.weekly_transfers, lagged_data.cumulative_portfolio_value, lagged_data.cumulative_transfers, lagged_data.prev_week_portfolio_value, lagged_data.weekly_gains AS weekly_return_absolute, CASE WHEN lagged_data.prev_week_portfolio_value > 0::numeric THEN (lagged_data.cumulative_portfolio_value - lagged_data.weekly_transfers - lagged_data.prev_week_portfolio_value) / lagged_data.prev_week_portfolio_value * 100::numeric ELSE NULL::numeric END AS weekly_return_percent FROM lagged_data WHERE lagged_data.prev_week_portfolio_value IS NOT NULL ) SELECT user_id, week_start, cumulative_portfolio_value, cumulative_transfers, weekly_return_percent, weekly_return_absolute FROM returns_calculation ORDER BY user_id, week_start`,
);

export const viewPortfolioDistribution = pgView("view_portfolio_distribution", {
  userId: integer("user_id"),
  symbol: varchar({ length: 50 }),
  positionValue: numeric("position_value"),
  instrumentCount: integer("instrument_count"),
  portfolioPercentage: numeric("portfolio_percentage"),
}).as(
  sql`SELECT user_id, underlying_symbol AS symbol, sum(position_value) AS position_value, count(*)::integer AS instrument_count, abs(sum(position_value)) / sum(abs(sum(position_value))) OVER (PARTITION BY user_id) * 100::numeric AS portfolio_percentage FROM view_positions WHERE position_status = 'OPEN'::text GROUP BY user_id, underlying_symbol ORDER BY (abs(sum(position_value))) DESC`,
);

export const viewPositions = pgView("view_positions", {
  userId: integer("user_id"),
  symbol: varchar({ length: 50 }),
  underlyingSymbol: varchar("underlying_symbol", { length: 50 }),
  securityType: text("security_type"),
  optionType: text("option_type"),
  strikePrice: numeric("strike_price", { precision: 18, scale: 8 }),
  quantityHeld: numeric("quantity_held"),
  positionValue: numeric("position_value"),
  netPositionValue: numeric("net_position_value"),
  averagePrice: numeric("average_price"),
  totalFees: numeric("total_fees"),
  daysToExpiry: integer("days_to_expiry"),
  positionStatus: text("position_status"),
  firstTransactionDate: date("first_transaction_date"),
  lastTransactionDate: date("last_transaction_date"),
  transactionCount: integer("transaction_count"),
}).as(
  sql`SELECT a.user_id, s.symbol, s.underlying_symbol, max(s.security_type::text) AS security_type, max(s.option_type::text) AS option_type, s.strike_price, sum(ft.quantity) AS quantity_held, sum( CASE WHEN s.security_type::text = 'STOCK'::text THEN abs(ft.gross_amount) WHEN s.security_type::text = 'OPTION'::text THEN abs(ft.quantity) * s.strike_price * 100::numeric ELSE abs(ft.gross_amount) END) AS position_value, sum( CASE WHEN s.security_type::text = 'STOCK'::text THEN ft.net_amount WHEN s.security_type::text = 'OPTION'::text THEN abs(ft.quantity) * s.strike_price * 100::numeric - ft.fees ELSE ft.net_amount END) AS net_position_value, sum(abs(ft.quantity * ft.price_per_unit)) / NULLIF(sum(abs(ft.quantity)), 0::numeric) AS average_price, sum(ft.fees) AS total_fees, CASE WHEN max(s.expiry_date) IS NOT NULL THEN max(s.expiry_date) - CURRENT_DATE ELSE NULL::integer END AS days_to_expiry, CASE WHEN max(s.security_type::text) = 'OPTION'::text AND abs(sum(ft.quantity)) > 0.001 THEN 'OPEN'::text WHEN max(s.security_type::text) = 'STOCK'::text AND abs(sum(ft.quantity)) > 0.0001 THEN 'OPEN'::text ELSE 'CLOSED'::text END AS position_status, min(d.full_date) AS first_transaction_date, max(d.full_date) AS last_transaction_date, count(*)::integer AS transaction_count FROM fact_transactions ft JOIN dim_security s ON ft.security_key = s.security_key JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key JOIN dim_date d ON ft.date_key = d.date_key WHERE tt.action_category::text = ANY (ARRAY['TRADE'::character varying, 'CORPORATE'::character varying]::text[]) GROUP BY a.user_id, s.symbol, s.underlying_symbol, s.strike_price`,
);

export const viewPortfolioSummary = pgView("view_portfolio_summary", {
  userId: integer("user_id"),
  portfolioValue: numeric("portfolio_value"),
  cashBalance: numeric("cash_balance"),
  monthlyPnl: numeric("monthly_pnl"),
  yearlyPnl: numeric("yearly_pnl"),
  monthlyPnlPercent: numeric("monthly_pnl_percent"),
  yearlyPnlPercent: numeric("yearly_pnl_percent"),
  weeklyPnlPercent: numeric("weekly_pnl_percent"),
}).as(
  sql`WITH portfolio_value_calc AS ( SELECT a.user_id, sum(ft.net_amount) AS total_portfolio_value FROM fact_transactions ft JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key GROUP BY a.user_id ), position_values_calc AS ( SELECT view_positions.user_id, sum(view_positions.position_value) AS total_position_value FROM view_positions WHERE view_positions.position_status = 'OPEN'::text GROUP BY view_positions.user_id ), realised_monthly_pnl AS ( SELECT a.user_id, sum(ft.net_amount) AS monthly_realised_pnl FROM fact_transactions ft JOIN dim_date d ON ft.date_key = d.date_key JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key WHERE (tt.action_category::text = ANY (ARRAY['TRADE'::character varying, 'INCOME'::character varying]::text[])) AND d.year::numeric = EXTRACT(year FROM CURRENT_DATE) AND d.month_number::numeric = EXTRACT(month FROM CURRENT_DATE) GROUP BY a.user_id ), realised_yearly_pnl AS ( SELECT a.user_id, sum(ft.net_amount) AS yearly_realised_pnl FROM fact_transactions ft JOIN dim_date d ON ft.date_key = d.date_key JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key WHERE (tt.action_category::text = ANY (ARRAY['TRADE'::character varying, 'INCOME'::character varying]::text[])) AND d.year::numeric = EXTRACT(year FROM CURRENT_DATE) GROUP BY a.user_id ), realised_weekly_pnl AS ( SELECT a.user_id, sum(ft.net_amount) AS weekly_realised_pnl FROM fact_transactions ft JOIN dim_date d ON ft.date_key = d.date_key JOIN dim_account a ON ft.account_key = a.account_key JOIN dim_transaction_type tt ON ft.transaction_type_key = tt.transaction_type_key WHERE (tt.action_category::text = ANY (ARRAY['TRADE'::character varying, 'INCOME'::character varying]::text[])) AND d.full_date >= date_trunc('week'::text, CURRENT_DATE::timestamp with time zone) AND d.full_date <= CURRENT_DATE GROUP BY a.user_id ) SELECT u.id AS user_id, COALESCE(pv.total_portfolio_value, 0::numeric) AS portfolio_value, COALESCE(pv.total_portfolio_value - COALESCE(pvs.total_position_value, 0::numeric), pv.total_portfolio_value, 0::numeric) AS cash_balance, COALESCE(mp.monthly_realised_pnl, 0::numeric) AS monthly_pnl, COALESCE(yp.yearly_realised_pnl, 0::numeric) AS yearly_pnl, CASE WHEN COALESCE(pv.total_portfolio_value, 0::numeric) <> 0::numeric THEN COALESCE(mp.monthly_realised_pnl, 0::numeric) / pv.total_portfolio_value * 100::numeric ELSE 0::numeric END AS monthly_pnl_percent, CASE WHEN COALESCE(pv.total_portfolio_value, 0::numeric) <> 0::numeric THEN COALESCE(yp.yearly_realised_pnl, 0::numeric) / pv.total_portfolio_value * 100::numeric ELSE 0::numeric END AS yearly_pnl_percent, CASE WHEN COALESCE(pv.total_portfolio_value, 0::numeric) <> 0::numeric THEN COALESCE(wp.weekly_realised_pnl, 0::numeric) / pv.total_portfolio_value * 100::numeric ELSE 0::numeric END AS weekly_pnl_percent FROM users u LEFT JOIN portfolio_value_calc pv ON u.id = pv.user_id LEFT JOIN position_values_calc pvs ON u.id = pvs.user_id LEFT JOIN realised_monthly_pnl mp ON u.id = mp.user_id LEFT JOIN realised_yearly_pnl yp ON u.id = yp.user_id LEFT JOIN realised_weekly_pnl wp ON u.id = wp.user_id WHERE u.deleted_at IS NULL`,
);
