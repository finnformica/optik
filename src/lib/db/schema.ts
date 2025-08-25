import { eq, relations, sql } from 'drizzle-orm';
import {
  bigint,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  pgView,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { createPerformanceViewSQL } from './utils';


export const transactionAction = pgEnum("transaction_action", [
  "buy", 
  "sell", 
  "buy_to_open", 
  "sell_to_close", 
  "sell_to_open", 
  "buy_to_close",
  "expire",
  "assign",
  "dividend", 
  "interest",
  "transfer",
  "other",
]);
export const transactionActionSchema = createSelectSchema(transactionAction);
export type ITransactionAction = typeof transactionAction.enumValues[number];

export const broker = pgEnum("broker", [
  "schwab",
  "robinhood",
  "etrade",
  "fidelity",
  "tda",
  "vanguard",
]);
export const brokerSchema = createSelectSchema(broker);
export type IBroker = typeof broker.enumValues[number];

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
  broker: broker('broker').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  transactionId: bigint('transaction_id', { mode: 'number' }).unique(), // Unique identifier from broker API
  broker: broker('broker').notNull(), // schwab, robinhood, etc
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // Core transaction fields
  date: date('date').notNull(), // date of the transaction
  action: transactionAction('action').notNull(), // buy, sell, buy_to_open, sell_to_close, interest, dividend, etc
  ticker: varchar('ticker', { length: 50 }), // AAPL, MSFT, etc, null for transfers
  description: text('description'),
  quantity: decimal('quantity', { precision: 18, scale: 8 }).notNull(), // number of shares, number of contracts, etc
  fees: decimal('fees', { precision: 18, scale: 8 }).notNull().default("0"), // fees paid for the transaction
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(), // total amount paid or received for the transaction
  currency: varchar('currency', { length: 3 }).notNull().default('USD'), // USD, EUR, etc
  // Options fields
  strikePrice: decimal('strike_price', { precision: 18, scale: 8 }),
  expiryDate: date('expiry_date'),
  optionType: varchar('option_type', { length: 50 }),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  accessTokens: many(userAccessTokens),
  transactions: many(transactions),
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
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
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

// Create periodic the views using dynamic SQL query string
export const weeklyPerformance = pgView('weekly_performance', {
  userId: integer(),
  periodStart: text(),
  periodPnl: text(),
  periodPnlPercent: text(),
  portfolioValue: text(),
  periodTransfers: text(),
}).as(sql.raw(createPerformanceViewSQL('week')));

export const monthlyPerformance = pgView('monthly_performance', {
  userId: integer(),
  periodStart: text(),
  periodPnl: text(),
  periodPnlPercent: text(),
  portfolioValue: text(),
  periodTransfers: text(),
}).as(sql.raw(createPerformanceViewSQL('month')));

export const yearlyPerformance = pgView('yearly_performance', {
  userId: integer(),
  periodStart: text(),
  periodPnl: text(),
  periodPnlPercent: text(),
  portfolioValue: text(),
  periodTransfers: text(),
}).as(sql.raw(createPerformanceViewSQL('year')));


// Portfolio Summary View - For SummaryStats component
export const portfolioSummary = pgView('portfolio_summary', {
  userId: integer('user_id'),
  portfolioValue: text('portfolio_value'),
  cashBalance: text('cash_balance'),
  weeklyPnl: text('weekly_pnl'),
  monthlyPnl: text('monthly_pnl'),
  yearlyPnl: text('yearly_pnl'),
  weeklyPnlPercent: text('weekly_pnl_percent'),
  monthlyPnlPercent: text('monthly_pnl_percent'),
  yearlyPnlPercent: text('yearly_pnl_percent'),
}).as(sql`
  WITH latest_portfolio AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      cumulative_portfolio_value
    FROM account_value_over_time 
    ORDER BY user_id, week_start DESC
  ),
  latest_weekly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as weekly_pnl, 
      period_pnl_percent as weekly_pnl_percent
    FROM weekly_performance 
    ORDER BY user_id, period_start DESC
  ),
  latest_monthly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as monthly_pnl, 
      period_pnl_percent as monthly_pnl_percent
    FROM monthly_performance 
    ORDER BY user_id, period_start DESC
  ),
  latest_yearly AS (
    SELECT DISTINCT ON (user_id) 
      user_id, 
      period_pnl as yearly_pnl, 
      period_pnl_percent as yearly_pnl_percent
    FROM yearly_performance 
    ORDER BY user_id, period_start DESC
  ),
  position_costs AS (
    SELECT 
      user_id,
      COALESCE(SUM(cost_basis::numeric), 0) as total_position_cost
    FROM positions
    GROUP BY user_id
  )
  SELECT 
    lp.user_id,
    lp.cumulative_portfolio_value as portfolio_value,
    (lp.cumulative_portfolio_value::numeric - COALESCE(pc.total_position_cost, 0))::text as cash_balance,
    COALESCE(lw.weekly_pnl, '0') as weekly_pnl,
    COALESCE(lm.monthly_pnl, '0') as monthly_pnl,
    COALESCE(ly.yearly_pnl, '0') as yearly_pnl,
    COALESCE(lw.weekly_pnl_percent, '0') as weekly_pnl_percent,
    COALESCE(lm.monthly_pnl_percent, '0') as monthly_pnl_percent,
    COALESCE(ly.yearly_pnl_percent, '0') as yearly_pnl_percent
  FROM latest_portfolio lp
  LEFT JOIN position_costs pc ON lp.user_id = pc.user_id
  LEFT JOIN latest_weekly lw ON lp.user_id = lw.user_id
  LEFT JOIN latest_monthly lm ON lp.user_id = lm.user_id
  LEFT JOIN latest_yearly ly ON lp.user_id = ly.user_id
`);

// Account Value Over Time View - For AccountValueChart component
export const accountValueOverTime = pgView('account_value_over_time', {
  userId: integer('user_id'),
  weekStart: text('week_start'),
  cumulativeTransfers: text('cumulative_transfers'),
  cumulativePortfolioValue: text('cumulative_portfolio_value'),
}).as(sql`
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
    WHERE action != 'other' AND date <= CURRENT_DATE
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
`);

// Transaction Details View - Reusable transaction formatting for positions
export const transactionDetails = pgView('transaction_details').as((qb) =>
  qb
    .select({
      userId: transactions.userId,
      ticker: transactions.ticker,
      optionType: transactions.optionType,
      strikePrice: transactions.strikePrice,
      // Position grouping key
      positionKey: sql<string>`CONCAT(${transactions.ticker}, '-', COALESCE(${transactions.optionType}, 'STOCK'), '-', COALESCE(${transactions.strikePrice}::text, '0'))`.as('position_key'),
      // Formatted transaction details as JSON array
      transactionDetails: sql<string>`JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', ${transactions.id},
          'date', ${transactions.date},
          'action', ${transactions.action},
          'quantity', ${transactions.quantity},
          'amount', ${transactions.amount},
          'fees', ${transactions.fees},
          'description', ${transactions.description},
          'unitPrice', CASE 
            WHEN ${transactions.optionType} IS NOT NULL THEN ${transactions.strikePrice}::numeric
            ELSE ABS(${transactions.amount}::numeric / ${transactions.quantity}::numeric)
          END,
          'creditDebitType', CASE WHEN ${transactions.amount}::numeric > 0 THEN 'CR' ELSE 'DB' END,
          'realizedPnl', CASE 
            WHEN ${transactions.optionType} IS NOT NULL THEN ${transactions.amount}::numeric - ${transactions.fees}::numeric
            ELSE 0
          END,
          'unrealizedPnl', CASE 
            WHEN ${transactions.optionType} IS NOT NULL THEN 0
            ELSE ${transactions.amount}::numeric - ${transactions.fees}::numeric
          END,
          'optionType', ${transactions.optionType},
          'costBasis', CASE 
            WHEN ${transactions.optionType} IS NOT NULL THEN ${transactions.strikePrice}::numeric * 100 * ${transactions.quantity}::numeric
            ELSE ${transactions.amount}::numeric
          END
        ) ORDER BY ${transactions.date}
      )`.as('transaction_details'),
    })
    .from(transactions)
    .where(sql`${transactions.action} NOT IN ('dividend', 'interest', 'transfer', 'other')`)
    .groupBy(
      transactions.userId,
      transactions.ticker,
      transactions.optionType,
      transactions.strikePrice
    )
);

// Position Calculations View - Shared position-level calculations (cleaned up)
export const positionCalculations = pgView('position_calculations').as((qb) =>
  qb
    .select({
      userId: transactions.userId,
      ticker: transactions.ticker,
      optionType: transactions.optionType,
      strikePrice: transactions.strikePrice,
      // Position key for grouping
      positionKey: sql<string>`CONCAT(${transactions.ticker}, '-', COALESCE(${transactions.optionType}, 'STOCK'), '-', COALESCE(${transactions.strikePrice}::text, '0'))`.as('position_key'),
      // Net quantity calculation
      netQuantity: sql<string>`SUM(${transactions.quantity}::numeric)`.as('net_quantity'),
      // Cost basis (absolute value of money tied up)
      costBasis: sql<string>`ABS(SUM(CASE 
        WHEN ${transactions.optionType} IS NOT NULL THEN ${transactions.strikePrice}::numeric * 100 * ${transactions.quantity}::numeric
        ELSE ${transactions.amount}::numeric
      END))`.as('cost_basis'),
      // Realized P&L from closed portions
      realizedPnl: sql<string>`SUM(CASE 
        WHEN ${transactions.optionType} IS NOT NULL THEN ${transactions.amount}::numeric - ${transactions.fees}::numeric
        ELSE 0
      END)`.as('realized_pnl'),
      // Total P&L (realized + unrealized)
      totalPnl: sql<string>`SUM(${transactions.amount}::numeric - ${transactions.fees}::numeric)`.as('total_pnl'),
      // Total fees
      totalFees: sql<string>`SUM(${transactions.fees}::numeric)`.as('total_fees'),
      // Timing information
      openedAt: sql<string>`MIN(${transactions.date})`.as('opened_at'),
      closedAt: sql<string>`MAX(CASE WHEN ${transactions.action} IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN ${transactions.date} END)`.as('closed_at'),
      lastTransactionAt: sql<string>`MAX(${transactions.date})`.as('last_transaction_at'),
      daysHeld: sql<string>`CASE 
        WHEN SUM(${transactions.quantity}::numeric) = 0 THEN MAX(${transactions.date}) - MIN(${transactions.date})
        ELSE CURRENT_DATE - MIN(${transactions.date})
      END`.as('days_held'),
      // Status flags
      isExpiringSoon: sql<string>`false`.as('is_expiring_soon'), // Simplified without expiry date
      // Unrealized P&L (total - realized)
      unrealizedPnl: sql<string>`SUM(CASE 
        WHEN ${transactions.optionType} IS NOT NULL THEN 0
        ELSE ${transactions.amount}::numeric - ${transactions.fees}::numeric
      END)`.as('unrealized_pnl'),
    })
    .from(transactions)
    .where(sql`${transactions.action} NOT IN ('dividend', 'interest', 'transfer', 'other')`)
    .groupBy(
      transactions.userId,
      transactions.ticker,
      transactions.optionType,
      transactions.strikePrice
    )
);

// Unified Positions View - Replaces openPositions and closedPositions
export const positions = pgView('positions', {
  userId: integer('user_id'),
  ticker: varchar('ticker', { length: 50 }),
  optionType: varchar('option_type', { length: 50 }),
  strikePrice: decimal('strike_price', { precision: 18, scale: 8 }),
  positionKey: varchar('position_key', { length: 200 }),
  netQuantity: decimal('net_quantity', { precision: 18, scale: 8 }),
  costBasis: decimal('cost_basis', { precision: 18, scale: 8 }),
  unrealizedPnl: decimal('unrealized_pnl', { precision: 18, scale: 8 }),
  realizedPnl: decimal('realized_pnl', { precision: 18, scale: 8 }),
  totalPnl: decimal('total_pnl', { precision: 18, scale: 8 }),
  totalFees: decimal('total_fees', { precision: 18, scale: 8 }),
  openedAt: date('opened_at'),
  closedAt: date('closed_at'),
  lastTransactionAt: date('last_transaction_at'),
  daysHeld: integer('days_held'),
  isExpiringSoon: text('is_expiring_soon'),
  isOpen: text('is_open'), // Flag to distinguish open vs closed
  transactionDetails: text('transaction_details'),
}).as(sql`
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
`);

// Portfolio Distribution View - Uses strike price check instead of position_type
export const portfolioDistribution = pgView('portfolio_distribution').as((qb) =>
  qb
    .select({
      userId: positions.userId,
      ticker: positions.ticker,
      // For options, use contract size (quantity * 100 * strike) or premium paid, for stocks use cost basis
      positionValue: sql<string>`CASE 
        WHEN ${positions.strikePrice} IS NOT NULL 
        THEN ABS(${positions.netQuantity}::numeric * 100 * ${positions.strikePrice}::numeric)
        ELSE ABS(${positions.costBasis})
      END`.as('position_value'),
      netQuantity: positions.netQuantity,
      daysHeld: sql<string>`(CURRENT_DATE - ${positions.lastTransactionAt})`.as('days_held'),
    })
    .from(positions)
    .where(sql`${positions.isOpen} = 'true'`) // Only open positions
    .orderBy(sql`CASE 
      WHEN ${positions.strikePrice} IS NOT NULL 
      THEN ABS(${positions.netQuantity}::numeric * 100 * ${positions.strikePrice}::numeric)
      ELSE ABS(${positions.costBasis})
    END DESC`)
);

// Positions By Symbol View - Hierarchical grouping for symbol-first display
export const positionsBySymbol = pgView('positions_by_symbol', {
  userId: integer('user_id'),
  ticker: varchar('ticker', { length: 50 }),
  positionType: varchar('position_type', { length: 10 }), // 'OPEN' or 'CLOSED'
  totalPositions: text('total_positions'),
  totalPnl: text('total_pnl'),
  unrealizedPnl: text('unrealized_pnl'),
  realizedPnl: text('realized_pnl'),
  totalFees: text('total_fees'),
  expiringSoonCount: text('expiring_soon_count'),
  positionsData: text('positions_data'), // JSON array of positions
}).as(sql`
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
        'unrealizedPnl', unrealized_pnl,
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
`);

// Type exports for the views
export type TransactionDetail = typeof transactionDetails.$inferSelect;
export type PositionCalculation = typeof positionCalculations.$inferSelect;
export type Position = typeof positions.$inferSelect; // Unified position type
export type PortfolioSummary = typeof portfolioSummary.$inferSelect;
export type PortfolioDistribution = typeof portfolioDistribution.$inferSelect;
export type WeeklyPerformance = typeof weeklyPerformance.$inferSelect;
export type AccountValueOverTime = typeof accountValueOverTime.$inferSelect;
export type PositionsBySymbol = typeof positionsBySymbol.$inferSelect;

// For backward compatibility with dashboard components
export const currentPositions = pgView('current_positions_compat').as((qb) =>
  qb
    .select({
      userId: positions.userId,
      ticker: positions.ticker,
      optionType: positions.optionType,
      strikePrice: positions.strikePrice,
      netQuantity: positions.netQuantity,
      costBasis: positions.costBasis,
      lastTransactionDate: positions.lastTransactionAt, // Map for compatibility
      positionType: sql<string>`CASE WHEN ${positions.optionType} IS NOT NULL THEN 'OPTION' ELSE 'EQUITY' END`.as('position_type'),
    })
    .from(positions)
    .where(eq(positions.isOpen, 'true'))
);

// Legacy type aliases for backward compatibility
export type OpenPosition = Position;
export type ClosedPosition = Position;
export type CurrentPosition = typeof currentPositions.$inferSelect;
