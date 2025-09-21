import { db } from "@/lib/db/config";
import {
  factTransaction,
  StgTransaction,
  stgTransaction,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { getAccountKey } from "@/lib/auth/session";
import { prepareSchwabTransaction } from "./schwab";

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
 * Handles Schwab data transformation with batch processing
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
        inArray(stgTransaction.status, ["PENDING", "ERROR"])
      )
    );

  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  // Process transactions in batches to optimize performance
  const BATCH_SIZE = 10;
  const batches = [];

  for (let i = 0; i < pendingTransactions.length; i += BATCH_SIZE) {
    batches.push(pendingTransactions.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    const batchResults = await processBatchTransactions(batch, database);
    results.processed += batchResults.processed;
    results.failed += batchResults.failed;
    results.errors.push(...batchResults.errors);
  }

  return results;
}

/**
 * Process a batch of transactions efficiently
 */
async function processBatchTransactions(batch: any[], database: any) {
  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  const processedIds: number[] = [];
  const failedTransactions: { id: number; error: string }[] = [];
  const factTransactionInserts: any[] = [];

  // Process each transaction in the batch
  for (const rawTx of batch) {
    try {
      const factTransactionData = await prepareSingleTransaction(
        rawTx,
        database
      );
      if (factTransactionData) {
        factTransactionInserts.push(factTransactionData);
        processedIds.push(rawTx.id);
        results.processed++;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? `Transaction ${rawTx.brokerTransactionId}: ${error.message}`
          : `Transaction ${rawTx.brokerTransactionId}: Unknown error`;

      console.error(errorMessage);
      failedTransactions.push({
        id: rawTx.id,
        error: errorMessage,
      });
      results.failed++;
      results.errors.push(errorMessage);
    }
  }

  // Batch insert successful transactions
  if (factTransactionInserts.length > 0) {
    await database
      .insert(factTransaction)
      .values(factTransactionInserts)
      .onConflictDoNothing({
        target: [
          factTransaction.accountKey,
          factTransaction.brokerTransactionId,
          factTransaction.originalTransactionId,
        ],
      });
  }

  // Update processed transactions immediately for real-time progress
  if (processedIds.length > 0) {
    await database
      .update(stgTransaction)
      .set({
        status: "PROCESSED",
        processedAt: new Date(),
      })
      .where(inArray(stgTransaction.id, processedIds));
  }

  // Update failed transactions immediately for real-time progress
  if (failedTransactions.length > 0) {
    for (const failed of failedTransactions) {
      await database
        .update(stgTransaction)
        .set({
          status: "ERROR",
          errorMessage: failed.error,
          processedAt: new Date(),
        })
        .where(eq(stgTransaction.id, failed.id));
    }
  }

  return results;
}

/**
 * Prepare transaction data without inserting to database
 * Returns the data object ready for batch insertion
 */
async function prepareSingleTransaction(rawTx: StgTransaction, database: any) {
  const data = rawTx.rawData as any;

  // Route to broker-specific processor
  switch (rawTx.brokerCode) {
    case "schwab":
      return await prepareSchwabTransaction(rawTx, data, database);
    default:
      throw new Error(`Unsupported broker: ${rawTx.brokerCode}`);
  }
}
