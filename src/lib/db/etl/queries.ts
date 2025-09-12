import { db } from "@/lib/db/config";
import { dimAccount, dimDate, dimTransactionType, factTransactions, RawTransaction, rawTransactions, users, viewPositions } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

import { processSchwabTransaction } from "./schwab";

export interface SchwabActivity {
    activityId: number; // Unique identifier for each transaction/activity (maps to transactionId in DB)
    time: string;
    accountNumber: string;
    type: string;
    status: string;
    subAccount: string;
    tradeDate: string;
    description?: string; // Optional description field for various activity types
    positionId?: number;
    orderId?: number; // May be shared across multiple transactions from the same order
    netAmount: number;
    transferItems: TransferItem[];
  }
  
  export interface TransferItem {
    instrument: Instrument;
    amount: number;
    cost: number;
    price?: number;
    positionEffect?: 'OPENING' | 'CLOSING';
    feeType?: string;
  }
  
  export interface Instrument {
    assetType: 'CURRENCY' | 'OPTION' | 'EQUITY' | 'COLLECTIVE_INVESTMENT';
    status: string;
    symbol: string;
    description: string;
    instrumentId: number;
    closingPrice: number;
    // Option-specific fields
    expirationDate?: string;
    optionDeliverables?: OptionDeliverable[];
    optionPremiumMultiplier?: number;
    putCall?: 'PUT' | 'CALL';
    strikePrice?: number;
    type?: string;
    underlyingSymbol?: string;
    underlyingCusip?: string;
  }
  
  export interface OptionDeliverable {
    rootSymbol: string;
    strikePercent: number;
    deliverableNumber: number;
    deliverableUnits: number;
    deliverable?: any;
  }

  

/* 
 * Insert API data in raw transactions table
*/

export async function insertRawTransactions(data: SchwabActivity[], accountKey: number, tx?: any) {
    const database = tx || db;

    // Convert SchwabActivity to expected raw_transactions format
    const formattedData = data.map(activity => ({
      accountKey,
      brokerCode: 'schwab', // hard-coded from the dim_broker table
      brokerTransactionId: activity.activityId.toString(),
      rawData: activity,
      brokerTimestamp: new Date(activity.tradeDate),
      status: 'PENDING'
    }));

    await database.insert(rawTransactions).values(formattedData).onConflictDoNothing({
      target: [rawTransactions.brokerTransactionId, rawTransactions.brokerCode]
    });

    return formattedData.length;
}

/**
 * Process raw transactions into dimensional model
 * Handles Schwab data transformation
 */
export async function processRawTransactions(accountKey: number, tx?: any) {
    const database = tx || db;
    
    // Get pending transactions for account
    const pendingTransactions = await database.select()
      .from(rawTransactions)
      .where(
        and(
          eq(rawTransactions.accountKey, accountKey),
        //   eq(rawTransactions.status, 'PENDING'),
        inArray(rawTransactions.status, ['PENDING', 'ERROR'])
        )
      );
  
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[]
    };
  
    for (const rawTx of pendingTransactions) {
      try {
        await processSingleTransaction(rawTx, database);
        
        // Mark as processed
        await database.update(rawTransactions)
          .set({ 
            status: 'PROCESSED',
            processedAt: new Date()
          })
          .where(eq(rawTransactions.id, rawTx.id));
        
        results.processed++;
        
        } catch (error: unknown) {
           const errorMessage = error instanceof Error ? 
             `Transaction ${rawTx.brokerTransactionId}: ${error.message}` : 
             `Transaction ${rawTx.brokerTransactionId}: Unknown error`;

           console.error(errorMessage);
          
          // Mark as failed
        await database.update(rawTransactions)
          .set({ 
            status: 'ERROR',
            errorMessage: `Failed to process ${errorMessage}`,
            processedAt: new Date()
          })
          .where(eq(rawTransactions.id, rawTx.id));
        
        results.failed++;
        results.errors.push(errorMessage);
      }
    }
  
    return results;
  }

/**
 * Process a single raw transaction into dimensional model
 */
async function processSingleTransaction(rawTx: RawTransaction, database: any) {
    const data = rawTx.rawData as any;
    
    // Route to broker-specific processor
    switch (rawTx.brokerCode) {
      case 'schwab':
        return await processSchwabTransaction(rawTx, data, database);
      default:
        throw new Error(`Unsupported broker: ${rawTx.brokerCode}`);
    }
  }
  



export interface PortfolioSummary {
    portfolioValue: string;
    cashBalance: string;
    monthlyPnl: string;
    yearlyPnl: string;
    monthlyPnlPercent: string;
    yearlyPnlPercent: string;
    weeklyPnlPercent: string;
  }


export async function getPortfolioSummary(accountKey: number): Promise<PortfolioSummary> {
    try {
      const result = await db.execute(sql`
        WITH portfolio_value_calc AS (
          -- Calculate total portfolio value from all transaction flows
          SELECT 
            ft.account_key,
            SUM(ft.net_amount) as total_portfolio_value
          FROM ${factTransactions} ft
          JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
          WHERE ft.account_key = ${accountKey}
          GROUP BY ft.account_key
        ),
  
        position_values_calc AS (
          -- Current invested amount (position value of held positions)
          -- Note: position_value can be negative for short positions, positive for long positions
          SELECT 
            account_key,
            SUM(position_value) as total_position_value
          FROM ${viewPositions}
          WHERE position_status = 'OPEN' AND account_key = ${accountKey}
          GROUP BY account_key
        ),
  
        realised_monthly_pnl AS (
          -- Realised P/L for current month
          SELECT 
            ft.account_key,
            SUM(ft.net_amount) as monthly_realised_pnl
          FROM ${factTransactions} ft
          JOIN ${dimDate} d ON ft.date_key = d.date_key
          JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
          WHERE 
            tt.action_category IN ('TRADE', 'INCOME')
            AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
            AND d.month_number = EXTRACT(MONTH FROM CURRENT_DATE)
            AND ft.account_key = ${accountKey}
          GROUP BY ft.account_key
        ),
  
        realised_yearly_pnl AS (
          -- Realised P/L for current year
          SELECT 
            ft.account_key,
            SUM(ft.net_amount) as yearly_realised_pnl
          FROM ${factTransactions} ft
          JOIN ${dimDate} d ON ft.date_key = d.date_key
          JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
          WHERE 
            tt.action_category IN ('TRADE', 'INCOME')
            AND d.year = EXTRACT(YEAR FROM CURRENT_DATE)
            AND ft.account_key = ${accountKey}
          GROUP BY ft.account_key
        ),
  
        realised_weekly_pnl AS (
          -- Realised P/L for current week
          SELECT 
            ft.account_key,
            SUM(ft.net_amount) as weekly_realised_pnl
          FROM ${factTransactions} ft
          JOIN ${dimDate} d ON ft.date_key = d.date_key
          JOIN ${dimTransactionType} tt ON ft.transaction_type_key = tt.transaction_type_key
          WHERE 
            tt.action_category IN ('TRADE', 'INCOME')
            AND d.full_date >= DATE_TRUNC('week', CURRENT_DATE)
            AND d.full_date <= CURRENT_DATE
            AND ft.account_key = ${accountKey}
          GROUP BY ft.account_key
        )
  
        -- Final summary query
        SELECT 
          a.account_key,
          COALESCE(pv.total_portfolio_value, 0)::text as portfolio_value,
          COALESCE(pv.total_portfolio_value - COALESCE(pvs.total_position_value, 0), pv.total_portfolio_value, 0)::text as cash_balance,
          COALESCE(mp.monthly_realised_pnl, 0)::text as monthly_pnl, 
          COALESCE(yp.yearly_realised_pnl, 0)::text as yearly_pnl,
          
          -- Calculate percentage changes
          CASE 
            WHEN COALESCE(pv.total_portfolio_value, 0) != 0 
            THEN (COALESCE(mp.monthly_realised_pnl, 0) / pv.total_portfolio_value * 100)::text
            ELSE '0'
          END as monthly_pnl_percent,
          
          CASE 
            WHEN COALESCE(pv.total_portfolio_value, 0) != 0 
            THEN (COALESCE(yp.yearly_realised_pnl, 0) / pv.total_portfolio_value * 100)::text
            ELSE '0'
          END as yearly_pnl_percent,
          
          CASE 
            WHEN COALESCE(pv.total_portfolio_value, 0) != 0 
            THEN (COALESCE(wp.weekly_realised_pnl, 0) / pv.total_portfolio_value * 100)::text
            ELSE '0'
          END as weekly_pnl_percent
  
        FROM ${dimAccount} a
        LEFT JOIN portfolio_value_calc pv ON a.account_key = pv.account_key
        LEFT JOIN position_values_calc pvs ON a.account_key = pvs.account_key
        LEFT JOIN realised_monthly_pnl mp ON a.account_key = mp.account_key
        LEFT JOIN realised_yearly_pnl yp ON a.account_key = yp.account_key
        LEFT JOIN realised_weekly_pnl wp ON a.account_key = wp.account_key
        WHERE a.account_key = ${accountKey}
        AND a.is_active = true
      `);
  
      const row = result[0];
      
      if (!row) {
        // Return default values if user has no transactions
        return {
          portfolioValue: '0',
          cashBalance: '0',
          monthlyPnl: '0',
          yearlyPnl: '0',
          monthlyPnlPercent: '0',
          yearlyPnlPercent: '0',
          weeklyPnlPercent: '0',
        };
      }
  
      return {
         portfolioValue: String(row.portfolio_value),
         cashBalance: String(row.cash_balance),
         monthlyPnl: String(row.monthly_pnl),
         yearlyPnl: String(row.yearly_pnl),
         monthlyPnlPercent: String(row.monthly_pnl_percent),
         yearlyPnlPercent: String(row.yearly_pnl_percent),
         weeklyPnlPercent: String(row.weekly_pnl_percent),
       };
  
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      throw new Error('Failed to fetch portfolio summary');
    }
  }