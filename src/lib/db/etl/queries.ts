import { db } from "@/lib/db/config";
import { StgTransaction, stgTransaction } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { getAccountKey } from "@/lib/auth/session";
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
  positionEffect?: "OPENING" | "CLOSING";
  feeType?: string;
}

export interface Instrument {
  assetType: "CURRENCY" | "OPTION" | "EQUITY" | "COLLECTIVE_INVESTMENT";
  status: string;
  symbol: string;
  description: string;
  instrumentId: number;
  closingPrice: number;
  // Option-specific fields
  expirationDate?: string;
  optionDeliverables?: OptionDeliverable[];
  optionPremiumMultiplier?: number;
  putCall?: "PUT" | "CALL";
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

export async function insertRawTransactions(data: SchwabActivity[], tx?: any) {
  const accountKey = await getAccountKey();
  const database = tx || db;

  // Convert SchwabActivity to expected stg_transaction format
  const formattedData = data.map((activity) => ({
    accountKey,
    brokerCode: "schwab", // hard-coded from the dim_broker table
    brokerTransactionId: activity.activityId.toString(),
    rawData: activity,
    brokerTimestamp: new Date(activity.tradeDate),
    status: "PENDING",
  }));

  await database
    .insert(stgTransaction)
    .values(formattedData)
    .onConflictDoNothing({
      target: [
        stgTransaction.accountKey,
        stgTransaction.brokerTransactionId,
        stgTransaction.brokerCode,
      ],
    });

  return formattedData.length;
}

/**
 * Process raw transactions into dimensional model
 * Handles Schwab data transformation
 */
export async function processRawTransactions(tx?: any) {
  const accountKey = await getAccountKey();
  const database = tx || db;

  // Get pending transactions for account
  const pendingTransactions = await database
    .select()
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        //   eq(stgTransaction.status, 'PENDING'),
        inArray(stgTransaction.status, ["PENDING", "ERROR"]),
      ),
    );

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const rawTx of pendingTransactions) {
    try {
      await processSingleTransaction(rawTx, database);

      // Mark as processed
      await database
        .update(stgTransaction)
        .set({
          status: "PROCESSED",
          processedAt: new Date(),
        })
        .where(eq(stgTransaction.id, rawTx.id));

      results.processed++;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? `Transaction ${rawTx.brokerTransactionId}: ${error.message}`
          : `Transaction ${rawTx.brokerTransactionId}: Unknown error`;

      console.error(errorMessage);

      // Mark as failed
      await database
        .update(stgTransaction)
        .set({
          status: "ERROR",
          errorMessage: `Failed to process ${errorMessage}`,
          processedAt: new Date(),
        })
        .where(eq(stgTransaction.id, rawTx.id));

      results.failed++;
      results.errors.push(errorMessage);
    }
  }

  return results;
}

/**
 * Process a single raw transaction into dimensional model
 */
async function processSingleTransaction(rawTx: StgTransaction, database: any) {
  const data = rawTx.rawData as any;

  // Route to broker-specific processor
  switch (rawTx.brokerCode) {
    case "schwab":
      return await processSchwabTransaction(rawTx, data, database);
    default:
      throw new Error(`Unsupported broker: ${rawTx.brokerCode}`);
  }
}
