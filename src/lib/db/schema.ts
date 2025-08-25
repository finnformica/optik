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

// Analytics Views for Dashboard Components

// 1. Portfolio Summary View - For SummaryStats component
export const portfolioSummary = pgView('portfolio_summary', {
  userId: integer('user_id'),
  portfolioValue: text('portfolio_value'),
  cashBalance: text('cash_balance'),
  monthlyPnl: text('monthly_pnl'),
  yearlyPnl: text('yearly_pnl'),
  weeklyPnlAmount: text('weekly_pnl_amount'),
  monthlyPnlPercent: text('monthly_pnl_percent'),
  yearlyPnlPercent: text('yearly_pnl_percent'),
  totalIncome: text('total_income'),
  totalFees: text('total_fees'),
  uniqueTickers: text('unique_tickers'),
  totalTransactions: text('total_transactions'),
  firstTransactionDate: text('first_transaction_date'),
  lastTransactionDate: text('last_transaction_date'),
}).as(sql`
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
    FROM positions
    WHERE is_open = 'true'
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
`);

// 3. Weekly Performance View - For WeeklyReturnsChart component
export const weeklyPerformance = pgView('weekly_performance').as((qb) =>
  qb
    .select({
      userId: transactions.userId,
      weekStart: sql<string>`DATE_TRUNC('week', ${transactions.date})::date`.as('week_start'),
      // Weekly P/L from normalized amounts minus fees
      weeklyPnl: sql<string>`SUM(${transactions.amount}::numeric) - SUM(${transactions.fees}::numeric)`.as('weekly_pnl'),
      transactionCount: sql<string>`COUNT(*)`.as('transaction_count'),
    })
    .from(transactions)
    .where(sql`${transactions.action} NOT IN ('transfer', 'other') AND ${transactions.date} <= CURRENT_DATE`)
    .groupBy(transactions.userId, sql`DATE_TRUNC('week', ${transactions.date})`)
    .orderBy(transactions.userId, sql`week_start DESC`)
);

// 5. Account Value Over Time View - For AccountValueChart component
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

// Reusable Building Blocks

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
          'unitPrice', ABS(${transactions.amount}::numeric / ${transactions.quantity}::numeric),
          'creditDebitType', CASE WHEN ${transactions.amount}::numeric > 0 THEN 'CR' ELSE 'DB' END,
          'displayAction', CASE 
            WHEN ${transactions.action} IN ('buy', 'buy_to_open', 'buy_to_close') THEN 'BUY'
            ELSE 'SELL'
          END,
          'positionEffect', CASE 
            WHEN ${transactions.action} IN ('buy_to_open', 'sell_to_open') THEN 'OPENING'
            WHEN ${transactions.action} IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN 'CLOSING'
            ELSE 'OTHER'
          END,
          'priceDisplay', CONCAT(
            ABS(${transactions.amount}::numeric / ${transactions.quantity}::numeric)::text, 
            ' ', 
            CASE WHEN ${transactions.amount}::numeric > 0 THEN 'CR' ELSE 'DB' END
          ),
          'transactionPnl', ${transactions.amount}::numeric - ${transactions.fees}::numeric
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
        WHEN ${transactions.action} IN ('sell_to_close', 'buy_to_close', 'expire', 'assign') THEN ${transactions.amount}::numeric - ${transactions.fees}::numeric
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
    CASE 
      WHEN p.net_quantity::numeric = 0 THEN p.total_pnl -- All P&L is realized for closed positions
      ELSE p.realized_pnl
    END as realized_pnl,
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

// 8. Positions By Symbol View - Hierarchical grouping for symbol-first display
export const positionsBySymbol = pgView('positions_by_symbol', {
  userId: integer('user_id'),
  ticker: varchar('ticker', { length: 50 }),
  positionType: varchar('position_type', { length: 10 }), // 'OPEN' or 'CLOSED'
  totalPositions: text('total_positions'),
  totalPnl: text('total_pnl'),
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
