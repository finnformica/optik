import { and, eq, inArray, sql } from "drizzle-orm";

import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { stgTransaction } from "@/lib/db/schema";
import { updateSyncProgress } from "@/lib/sync-progress";
import { processSchwabTransactionsBatch } from "./schwab";

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

interface TransferItem {
  instrument: Instrument;
  amount: number;
  cost: number;
  price?: number;
  positionEffect?: "OPENING" | "CLOSING";
  feeType?: string;
}

interface Instrument {
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

interface OptionDeliverable {
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

// Helper function to get pending transaction IDs in batches
export async function getPendingTransactionIds(batchSize: number) {
  const accountKey = await getAccountKey();

  const pendingIds = await db
    .select({ id: stgTransaction.id })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        inArray(stgTransaction.status, ["PENDING", "FAILED"])
      )
    )
    .orderBy(stgTransaction.id)
    .limit(batchSize);

  return pendingIds.map((row) => row.id);
}

export async function getPendingTransactionCount() {
  const accountKey = await getAccountKey();

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        inArray(stgTransaction.status, ["PENDING", "FAILED"])
      )
    )
    .limit(1);
  return pendingCount.count;
}

// Updated batch processor with progress tracking
export async function processRawTransactionsWithProgress(batchSize: number) {
  let totalProcessed = 0;
  let totalFailed = 0;
  let allErrors: any[] = [];

  const pendingTransactionCount = await getPendingTransactionCount();

  while (true) {
    // Get next batch of pending transaction IDs
    const batchIds = await getPendingTransactionIds(batchSize);

    if (batchIds.length === 0) {
      break; // No more transactions to process
    }

    // Process the batch
    const batchResult = await processSchwabTransactionsBatch(batchIds);

    totalProcessed += batchResult.processed;
    totalFailed += batchResult.failed;
    allErrors.push(...batchResult.errors);

    // Update progress after each batch
    await updateSyncProgress("processing", {
      processed: totalProcessed,
      failed: totalFailed,
      remaining: pendingTransactionCount - totalProcessed - totalFailed,
    });

    // If batch size is smaller than requested, we're done
    if (batchIds.length < batchSize) {
      break;
    }
  }

  return {
    processed: totalProcessed,
    failed: totalFailed,
    errors: allErrors,
  };
}
