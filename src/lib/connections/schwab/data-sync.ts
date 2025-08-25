// lib/schwab-api-sync.ts
import { db } from '@/lib/db/config';
import { ITransactionAction, transactionActionSchema, transactions, type NewTransaction } from '@/lib/db/schema';

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

export interface ParsedOptionsData {
  ticker: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'PUT' | 'CALL';
}

export class SchwabAPISync {
  
  // Main sync function - processes API JSON and uploads to database
  static async syncAPIData(userId: number, activities: SchwabActivity[]): Promise<{
    success: boolean;
    processed: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      processed: 0,
      errors: [] as string[]
    };

    try {
      const processedTransactions: NewTransaction[] = [];
      
      for (let i = 0; i < activities.length; i++) {
        try {
          const activity = activities[i];
          
          // Only process valid activities
          if (activity.status !== 'VALID') {
            continue;
          }

          const processed = this.processActivity(userId, activity);
          
          if (processed) {
            processedTransactions.push(processed);
          }
        } catch (error) {
          result.errors.push(`Activity ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Insert into database using Drizzle with duplicate prevention
      if (processedTransactions.length > 0) {
        let insertedCount = 0;
        let duplicateCount = 0;
        
        // Insert transactions one by one to handle duplicates gracefully
        for (const transaction of processedTransactions) {
          try {
            await db.insert(transactions).values(transaction);
            insertedCount++;
          } catch (error) {
            if (error instanceof Error && error.message.includes('duplicate key')) {
              duplicateCount++;
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
        
        result.processed = insertedCount;
        result.success = true;
        
        if (duplicateCount > 0) {
          result.errors.push(`${duplicateCount} transactions were already imported (duplicate transactionId)`);
        }
      }

      return result;

    } catch (error) {
      result.errors.push(`Sync Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Process individual activity into database format
  private static processActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    // Handle different activity types
    switch (activity.type) {
      case 'TRADE':
        return this.processTradeActivity(userId, activity);
      case 'RECEIVE_AND_DELIVER':
        return this.processReceiveAndDeliverActivity(userId, activity);
      case 'DIVIDEND_OR_INTEREST':
        return this.processDividendOrInterestActivity(userId, activity);
      case 'WIRE_IN':
        return this.processWireInActivity(userId, activity);
      case 'WIRE_OUT':
        return this.processWireOutActivity(userId, activity);
      case 'SMA_ADJUSTMENT':
      default:
        console.warn(`WARNING: Unsupported activity type: ${activity.type}`);
        return null;
    }
  }

  // Process TRADE activities (existing logic)
  private static processTradeActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    // Find the main trading instrument (non-currency, non-fee items)
    const tradingItems = activity.transferItems.filter(item => 
      item.instrument.assetType !== 'CURRENCY' || !item.feeType
    );

    if (tradingItems.length === 0) {
      return null; // Skip activities with no actual trades
    }

    // Use the first trading item as the main transaction
    const mainItem = tradingItems[0];
    
    // Calculate total fees from currency items with feeType
    const totalFees = activity.transferItems
      .filter(item => item.instrument.assetType === 'CURRENCY' && item.feeType)
      .reduce((sum, item) => sum + Math.abs(item.cost), 0);

    // Determine action based on position effect and cost direction
    const action = this.determineAction(mainItem);
    
    // Parse date from ISO string to YYYY-MM-DD
    const date = this.parseISODate(activity.tradeDate);
    
    // Normalize quantity: positive = position gained, negative = position lost
    const normalizedQuantity = this.normalizeQuantity(action, mainItem.amount);
    
    // Normalize amount: positive = cash received, negative = cash paid
    const normalizedAmount = this.normalizeAmount(action, activity.netAmount);

    if (mainItem.instrument.assetType === 'OPTION') {
      return this.processOptionsTransaction(
        userId, 
        activity, 
        mainItem, 
        action, 
        date, 
        normalizedQuantity, 
        normalizedAmount, 
        totalFees
      );
    } else if (mainItem.instrument.assetType === 'EQUITY' || mainItem.instrument.assetType === 'COLLECTIVE_INVESTMENT') {
      return this.processEquityTransaction(
        userId, 
        activity, 
        mainItem, 
        action, 
        date, 
        normalizedQuantity, 
        normalizedAmount, 
        totalFees
      );
    }

    return null;
  }

  // Process options transactions
  private static processOptionsTransaction(
    userId: number,
    activity: SchwabActivity,
    item: TransferItem,
    action: string,
    date: string,
    quantity: number,
    amount: number,
    fees: number
  ): NewTransaction {
    const instrument = item.instrument;
    
    if (!instrument.underlyingSymbol || !instrument.strikePrice || !instrument.expirationDate || !instrument.putCall) {
      throw new Error(`Invalid options data for symbol: ${instrument.symbol}`);
    }

    // Parse expiry date from ISO string to YYYY-MM-DD
    const expiryDate = this.parseISODate(instrument.expirationDate);
    const parsedAction = transactionActionSchema.parse(action);

    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action: parsedAction,
      ticker: instrument.underlyingSymbol,
      description: instrument.description,
      quantity: quantity.toString(),
      fees: fees.toString(),
      amount: amount.toString(),
      strikePrice: instrument.strikePrice.toString(),
      expiryDate,
      optionType: instrument.putCall,
    };
  }

  // Process equity transactions
  private static processEquityTransaction(
    userId: number,
    activity: SchwabActivity,
    item: TransferItem,
    action: string,
    date: string,
    quantity: number,
    amount: number,
    fees: number
  ): NewTransaction {
    const { instrument } = item;
    
    // For ETFs and stocks, use the symbol directly
    const ticker = instrument.symbol;

    const parsedAction = transactionActionSchema.parse(action);

    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action: parsedAction,
      ticker,
      description: instrument.description,
      quantity: quantity.toString(),
      fees: fees.toString(),
      amount: amount.toString(),
      strikePrice: null,
      expiryDate: null,
      optionType: null,
    };
  }

  // Determine action based on position effect and cost direction
  private static determineAction(item: TransferItem): ITransactionAction {
    if (item.instrument.assetType === 'OPTION') {
      // For options, use position effect and cost direction
      if (item.positionEffect === 'OPENING') {
        return item.cost > 0 ? 'sell_to_open' : 'buy_to_open';
      } else if (item.positionEffect === 'CLOSING') {
        return item.cost > 0 ? 'sell_to_close' : 'buy_to_close';
      }
    }
    
    // For stocks/ETFs, use cost direction
    return item.cost > 0 ? 'sell' : 'buy';
  }

  // Process RECEIVE_AND_DELIVER activities (option expirations, exercises, assignments)
  private static processReceiveAndDeliverActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    // Find the non-currency instruments
    const nonCurrencyItems = activity.transferItems.filter(item => 
      item.instrument.assetType !== 'CURRENCY'
    );

    if (nonCurrencyItems.length === 0) {
      return null;
    }

    const mainItem = nonCurrencyItems[0];
    const date = this.parseISODate(activity.tradeDate);
    
    // For RECEIVE_AND_DELIVER, determine action based on description and asset type
    let ticker: string;
    let action: ITransactionAction;
    
    if (mainItem.instrument.assetType === 'OPTION') {
      ticker = mainItem.instrument.underlyingSymbol || mainItem.instrument.symbol;
      
      // Determine if it's expiration or assignment based on description
      const description = activity.description?.toLowerCase() || '';
      if (description.includes('expiration') || description.includes('expire')) {
        action = 'expire';
      } else if (description.includes('assignment') || description.includes('assign') || description.includes('exercise')) {
        action = 'assign';
      } else {
        action = 'expire'; // Default to expire for options RECEIVE_AND_DELIVER
      }
    } else {
      ticker = mainItem.instrument.symbol;
      action = 'transfer'; // Keep as transfer for non-option instruments
    }

    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action,
      ticker,
      description: activity.description || mainItem.instrument.description,
      quantity: this.normalizeQuantity(action, mainItem.amount).toString(),
      fees: '0',
      amount: this.normalizeAmount(action, activity.netAmount).toString(),
      strikePrice: mainItem.instrument.strikePrice?.toString() || null,
      expiryDate: mainItem.instrument.expirationDate ? this.parseISODate(mainItem.instrument.expirationDate) : null,
      optionType: mainItem.instrument.putCall || null,
    };
  }

  // Process DIVIDEND_OR_INTEREST activities
  private static processDividendOrInterestActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    const date = this.parseISODate(activity.tradeDate);
    
    // Determine if it's dividend or interest based on description
    const isInterest = activity.description?.toLowerCase().includes('int') || 
                      activity.description?.toLowerCase().includes('interest');
    const action: ITransactionAction = isInterest ? 'interest' : 'dividend';
    
    // Use a generic ticker for cash activities - could be enhanced to parse actual ticker from description
    
    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action,
      ticker: null,
      description: activity.description || 'Dividend/Interest payment',
      quantity: '1',
      fees: '0',
      amount: this.normalizeAmount(action, activity.netAmount).toString(),
      strikePrice: null,
      expiryDate: null,
      optionType: null,
    };
  }

  // Process WIRE_IN activities
  private static processWireInActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    const date = this.parseISODate(activity.tradeDate);
    
    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action: 'transfer',
      ticker: null,
      description: activity.description || 'Wire transfer in',
      quantity: '1',
      fees: '0',
      amount: this.normalizeAmount('transfer', activity.netAmount).toString(),
      strikePrice: null,
      expiryDate: null,
      optionType: null,
    };
  }

  // Process WIRE_OUT activities
  private static processWireOutActivity(userId: number, activity: SchwabActivity): NewTransaction | null {
    const date = this.parseISODate(activity.tradeDate);
    
    return {
      userId,
      transactionId: activity.activityId,
      broker: 'schwab',
      date,
      action: 'transfer',
      ticker: null,
      description: activity.description || 'Wire transfer out',
      quantity: '1',
      fees: '0',
      amount: this.normalizeAmount('transfer', activity.netAmount).toString(),
      strikePrice: null,
      expiryDate: null,
      optionType: null,
    };
  }

  // Parse ISO date string to YYYY-MM-DD format
  private static parseISODate(isoString: string): string {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  }

  // Normalize amount: positive = cash received, negative = cash paid
  private static normalizeAmount(action: ITransactionAction, netAmount: number): number {
    switch (action) {
      // Cash received (positive)
      case 'sell':
      case 'sell_to_close':
      case 'sell_to_open':
      case 'dividend':
      case 'interest':
        return Math.abs(netAmount);
      
      // Cash paid (negative)  
      case 'buy':
      case 'buy_to_open':
      case 'buy_to_close':
        return -Math.abs(netAmount);
      
      // No cash flow
      case 'expire':
      case 'assign':
        return 0;
      
      // Transfers keep original sign
      case 'transfer':
        return netAmount;
      
      default:
        return netAmount;
    }
  }

  // Normalize quantity: positive = position gained, negative = position lost
  private static normalizeQuantity(action: ITransactionAction, amount: number): number {
    switch (action) {
      // Position gained (positive)
      case 'buy':
      case 'buy_to_open':
      case 'sell_to_open':
        return Math.abs(amount);
      
      // Position lost/closed (negative)
      case 'sell':
      case 'sell_to_close':
      case 'buy_to_close':
      case 'expire':
      case 'assign':
        return -Math.abs(amount);
      
      // Transfers/other keep absolute value
      case 'transfer':
      case 'dividend':
      case 'interest':
      case 'other':
        return Math.abs(amount);
      
      default:
        return Math.abs(amount);
    }
  }
}