import { relations, sql } from 'drizzle-orm';
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
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';


// ------------------------------------------------------------
// Users, Teams, Team Members, Activity Logs, Invitations, User Access Tokens
// ------------------------------------------------------------

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const userAccessTokens = pgTable('user_access_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  encryptedTokens: text('encrypted_tokens').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  tokenType: varchar('token_type', { length: 50 }).notNull(),
  scope: varchar('scope', { length: 255 }).notNull(),
  broker: varchar('broker', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});


export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  accessTokens: many(userAccessTokens),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));


export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const userAccessTokensRelations = relations(userAccessTokens, ({ one }) => ({
  user: one(users, {
    fields: [userAccessTokens.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type UserAccessToken = typeof userAccessTokens.$inferSelect;
export type NewUserAccessToken = typeof userAccessTokens.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

// ------------------------------------------------------------
// Data Model
// ------------------------------------------------------------

// =============================================
// RAW TRANSACTIONS STAGING TABLE
// =============================================

export const rawTransactions = pgTable('raw_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  brokerCode: varchar('broker_code', { length: 20 }).notNull(),
  brokerTransactionId: varchar('broker_transaction_id', { length: 50 }).notNull(),
  
  // Raw broker data
  rawData: json('raw_data').notNull(),
  
  // Processing status
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  errorMessage: text('error_message'),
  
  // Timestamps
  brokerTimestamp: timestamp('broker_timestamp').notNull(), // When transaction actually occurred per broker
  processedAt: timestamp('processed_at'), // When we processed it into dimensional model
  createdAt: timestamp('created_at').notNull().defaultNow(), // When record was inserted
  updatedAt: timestamp('updated_at').notNull().defaultNow() // When record was last modified
}, (table) => [
  unique('unique_broker_transaction').on(table.brokerTransactionId, table.brokerCode),
  index('idx_raw_transactions_user_status').on(table.userId, table.status),
  index('idx_raw_transactions_broker_id').on(table.brokerTransactionId)
]);



// =============================================
// DIMENSIONAL TABLES
// =============================================

// Date Dimension - Essential for time-based analytics
export const dimDate = pgTable('dim_date', {
  dateKey: integer('date_key').primaryKey(), // YYYYMMDD format
  fullDate: date('full_date').notNull().unique(),
  dayOfWeek: varchar('day_of_week', { length: 10 }),
  dayOfMonth: integer('day_of_month'),
  weekOfYear: integer('week_of_year'),
  monthName: varchar('month_name', { length: 10 }),
  monthNumber: integer('month_number'),
  quarter: integer('quarter'),
  year: integer('year'),
  isWeekend: boolean('is_weekend'),
  isTradingDay: boolean('is_trading_day'),
  weekEndingDate: date('week_ending_date'),
  monthEndingDate: date('month_ending_date'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => [
  index('idx_dim_date_full_date').on(table.fullDate),
  index('idx_dim_date_year_month').on(table.year, table.monthNumber)
]);

// Security Dimension - Handles stocks and options with company grouping
export const dimSecurity = pgTable('dim_security', {
  securityKey: serial('security_key').primaryKey(),

  symbol: varchar('symbol', { length: 50 }).notNull(),
  securityType: varchar('security_type', { length: 20 }).notNull(), // 'STOCK', 'OPTION'
  optionType: varchar('option_type', { length: 10 }), // 'CALL', 'PUT', NULL for stocks
  strikePrice: decimal('strike_price', { precision: 18, scale: 8 }), // NULL for stocks
  expiryDate: date('expiry_date'), // NULL for stocks
  
  // Essential fields for company-level aggregation
  securityName: text('security_name'),
  underlyingSymbol: varchar('underlying_symbol', { length: 50 }).notNull(), // Key for company grouping
  
  // Metadata
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  // Performance indexes
  index('idx_dim_security_underlying').on(table.underlyingSymbol),
  index('idx_dim_security_type').on(table.securityType),
  index('idx_dim_security_symbol').on(table.symbol),
  // Data integrity constraint
  check('check_stock_option', sql`
    (security_type = 'STOCK' AND underlying_symbol = symbol AND option_type IS NULL AND strike_price IS NULL AND expiry_date IS NULL)
    OR
    (security_type = 'OPTION' AND underlying_symbol != symbol AND option_type IS NOT NULL AND strike_price IS NOT NULL AND expiry_date IS NOT NULL)
  `)
]);

export type ITransactionAction = 'buy' | 'sell' | 'buy_to_open' | 'sell_to_close' | 'sell_to_open' | 'buy_to_close' | 'expire' | 'assign' | 'dividend' | 'interest' | 'transfer' | 'other';

// Transaction Type Dimension
export const dimTransactionType = pgTable('dim_transaction_type', {
  transactionTypeKey: serial('transaction_type_key').primaryKey(),
  actionCode: varchar('action_code', { length: 20 }).notNull().unique(),
  actionDescription: varchar('action_description', { length: 100 }),
  actionCategory: varchar('action_category', { length: 50 }), // 'TRADE', 'INCOME', 'TRANSFER', 'CORPORATE'
  affectsPosition: boolean('affects_position'),
  direction: integer('direction'), // +1 for inflows, -1 for outflows, 0 for neutral
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Account Dimension
export const dimAccount = pgTable('dim_account', {
  accountKey: serial('account_key').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  accountName: varchar('account_name', { length: 100 }).default('Primary Account'),
  accountType: varchar('account_type', { length: 50 }).default('INDIVIDUAL'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  unique('unique_user_account').on(table.userId) // One account per user for now
]);

// Broker Dimension
export const dimBroker = pgTable('dim_broker', {
  brokerKey: serial('broker_key').primaryKey(),
  brokerCode: varchar('broker_code', { length: 20 }).notNull().unique(),
  brokerName: varchar('broker_name', { length: 100 }),
  commissionStructure: varchar('commission_structure', { length: 100 }),
  apiProvider: varchar('api_provider', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// =============================================
// FACT TABLES
// =============================================

// Transaction Fact Table - One row per trade
export const factTransactions = pgTable('fact_transactions', {
  // Dimension Foreign Keys
  dateKey: integer('date_key').notNull().references(() => dimDate.dateKey),
  accountKey: integer('account_key').notNull().references(() => dimAccount.accountKey),
  securityKey: integer('security_key').notNull().references(() => dimSecurity.securityKey),
  transactionTypeKey: integer('transaction_type_key').notNull().references(() => dimTransactionType.transactionTypeKey),
  brokerKey: integer('broker_key').notNull().references(() => dimBroker.brokerKey),
  
  // Degenerate dimensions (stay in fact table)
  brokerTransactionId: varchar('broker_transaction_id', { length: 50 }),
  orderId: varchar('order_id', { length: 50 }),
  originalTransactionId: integer('original_transaction_id'), // Reference to legacy transactions.id
  
  // Facts (measurements)
  quantity: decimal('quantity', { precision: 18, scale: 8 }).notNull(),
  pricePerUnit: decimal('price_per_unit', { precision: 18, scale: 8 }),
  grossAmount: decimal('gross_amount', { precision: 18, scale: 8 }).notNull(),
  fees: decimal('fees', { precision: 18, scale: 8 }).notNull().default('0'),
  netAmount: decimal('net_amount', { precision: 18, scale: 8 }).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  // Foreign key to security dimension
  foreignKey({
    columns: [table.securityKey],
    foreignColumns: [dimSecurity.securityKey],
    name: 'fk_fact_transactions_security'
  }),
  
  // Unique constraint for idempotent loading
  unique('unique_transaction').on(table.brokerTransactionId, table.originalTransactionId),
  
  // Performance indexes
  index('idx_fact_transactions_date').on(table.dateKey),
  index('idx_fact_transactions_account').on(table.accountKey),
  index('idx_fact_transactions_security').on(table.securityKey),
]);

// Current Positions Fact Table - Maintained by triggers, no background jobs
export const factCurrentPositions = pgTable('fact_current_positions', {
  // Dimension Foreign Keys
  accountKey: integer('account_key').notNull().references(() => dimAccount.accountKey),
  securityKey: integer('security_key').notNull().references(() => dimSecurity.securityKey),
  
  // Facts (semi-additive - don't sum across time!)
  quantityHeld: decimal('quantity_held', { precision: 18, scale: 8 }).notNull(),
  costBasis: decimal('cost_basis', { precision: 18, scale: 8 }).notNull(),
  averagePrice: decimal('average_price', { precision: 18, scale: 8 }),
  
  // Position tracking metadata
  firstTransactionDate: date('first_transaction_date'),
  lastTransactionDate: date('last_transaction_date'),
  
  // Standard audit timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => [
  // Primary key
  primaryKey({ 
    columns: [table.accountKey, table.securityKey] 
  }),
  
  // Foreign key to security dimension
  foreignKey({
    columns: [table.securityKey],
    foreignColumns: [dimSecurity.securityKey],
    name: 'fk_fact_current_positions_security'
  }),
  
  // Performance indexes
  index('idx_fact_positions_account').on(table.accountKey),
  index('idx_fact_positions_security').on(table.securityKey),
]);

// =============================================
// ANALYTICAL VIEWS
// =============================================

// Company-Level Positions (Your main requirement for multi-strategy trading)
export const viewCompanyPositions = pgView('view_company_positions', {
  userId: integer('user_id'),
  companySymbol: varchar('company_symbol', { length: 50 }),
  displayName: varchar('display_name', { length: 50 }),
  totalPositions: integer('total_positions'),
  stockPositions: integer('stock_positions'),
  optionPositions: integer('option_positions'),
  totalContractsShares: decimal('total_contracts_shares', { precision: 18, scale: 8 }),
  stockShares: decimal('stock_shares', { precision: 18, scale: 8 }),
  shortPuts: decimal('short_puts', { precision: 18, scale: 8 }),
  shortCalls: decimal('short_calls', { precision: 18, scale: 8 }),
  longPuts: decimal('long_puts', { precision: 18, scale: 8 }),
  longCalls: decimal('long_calls', { precision: 18, scale: 8 }),
  totalCostBasis: decimal('total_cost_basis', { precision: 18, scale: 8 }),
  firstPositionDate: date('first_position_date'),
  mostRecentTransaction: date('most_recent_transaction'),
  primaryStrategy: varchar('primary_strategy', { length: 50 })
}).as(sql`
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
`);


// View for open and closed positions
export const viewPositions = pgView('view_positions', {
  userId: integer('user_id'),
  symbol: varchar('symbol', { length: 50 }),
  securityType: varchar('security_type', { length: 20 }),
  underlyingSymbol: varchar('underlying_symbol', { length: 50 }),
  optionType: varchar('option_type', { length: 10 }),
  strikePrice: decimal('strike_price', { precision: 18, scale: 8 }),
  expiryDate: date('expiry_date'),
  quantityHeld: decimal('quantity_held', { precision: 18, scale: 8 }),
  costBasis: decimal('cost_basis', { precision: 18, scale: 8 }),
  averagePrice: decimal('average_price', { precision: 18, scale: 8 }),
  realisedPnl: decimal('realised_pnl', { precision: 18, scale: 8 }),
  totalFees: decimal('total_fees', { precision: 18, scale: 8 }),
  daysToExpiry: integer('days_to_expiry'),
  direction: varchar('direction', { length: 10 }),
  positionStatus: varchar('position_status', { length: 10 }),
  firstTransactionDate: date('first_transaction_date'),
  lastTransactionDate: date('last_transaction_date'),
  transactionCount: integer('transaction_count')
}).as(sql`
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
`);


// Portfolio Distribution (Your dashboard pie chart)
export const viewPortfolioDistribution = pgView('view_portfolio_distribution', {
  userId: integer('user_id'),
  company: varchar('company', { length: 50 }),
  positionValue: decimal('position_value', { precision: 18, scale: 8 }),
  instrumentCount: integer('instrument_count'),
  portfolioPercentage: decimal('portfolio_percentage', { precision: 10, scale: 4 })
}).as(sql`
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
`);

// Account Value Over Time (Your dashboard top-right chart)
export const viewAccountValueOverTime = pgView('view_account_value_over_time', {
  userId: integer('user_id'),
  weekStart: date('week_start'),
  cumulativeTransfers: decimal('cumulative_transfers', { precision: 18, scale: 8 }),
  cumulativePortfolioValue: decimal('cumulative_portfolio_value', { precision: 18, scale: 8 })
}).as(sql`
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
`);

// =============================================
// RELATIONS (for Drizzle ORM)
// =============================================

export const rawTransactionsRelations = relations(rawTransactions, ({ one }) => ({
  user: one(users, {
    fields: [rawTransactions.userId],
    references: [users.id]
  })
}));


export const dimAccountRelations = relations(dimAccount, ({ one, many }) => ({
  user: one(users, {
    fields: [dimAccount.userId],
    references: [users.id]
  }),
  transactions: many(factTransactions),
  positions: many(factCurrentPositions)
}));

export const factTransactionsRelations = relations(factTransactions, ({ one }) => ({
  date: one(dimDate, {
    fields: [factTransactions.dateKey],
    references: [dimDate.dateKey]
  }),
  account: one(dimAccount, {
    fields: [factTransactions.accountKey],
    references: [dimAccount.accountKey]
  }),
  transactionType: one(dimTransactionType, {
    fields: [factTransactions.transactionTypeKey],
    references: [dimTransactionType.transactionTypeKey]
  }),
  broker: one(dimBroker, {
    fields: [factTransactions.brokerKey],
    references: [dimBroker.brokerKey]
  }),
  security: one(dimSecurity, {
    fields: [factTransactions.securityKey],
    references: [dimSecurity.securityKey]
  })
}));

export const factCurrentPositionsRelations = relations(factCurrentPositions, ({ one }) => ({
  account: one(dimAccount, {
    fields: [factCurrentPositions.accountKey],
    references: [dimAccount.accountKey]
  }),
  security: one(dimSecurity, {
    fields: [factCurrentPositions.securityKey],
    references: [dimSecurity.securityKey]
  })
}));

// =============================================
// TYPE EXPORTS
// =============================================

export type DimDate = typeof dimDate.$inferSelect;
export type DimSecurity = typeof dimSecurity.$inferSelect;
export type DimTransactionType = typeof dimTransactionType.$inferSelect;
export type DimAccount = typeof dimAccount.$inferSelect;
export type DimBroker = typeof dimBroker.$inferSelect;

export type FactTransaction = typeof factTransactions.$inferSelect;
export type FactCurrentPosition = typeof factCurrentPositions.$inferSelect;

export type ViewCompanyPosition = typeof viewCompanyPositions.$inferSelect;
export type ViewPosition = typeof viewPositions.$inferSelect;
export type ViewPortfolioDistribution = typeof viewPortfolioDistribution.$inferSelect;
export type ViewAccountValueOverTime = typeof viewAccountValueOverTime.$inferSelect;

// Insert types
export type NewFactTransaction = typeof factTransactions.$inferInsert;
export type NewFactCurrentPosition = typeof factCurrentPositions.$inferInsert;
export type RawTransaction = typeof rawTransactions.$inferSelect;
export type NewRawTransaction = typeof rawTransactions.$inferInsert;