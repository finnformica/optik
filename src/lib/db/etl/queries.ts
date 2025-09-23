import { and, eq, inArray, sql } from "drizzle-orm";

import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { stgTransaction } from "@/lib/db/schema";
import { updateSyncProgress } from "@/lib/sync-progress";
import { BrokerCode } from "@/types/broker";
import { processSchwabTransactions, SchwabActivity } from "./schwab";

/*
 * Insert API data in raw transactions table
 */
export async function insertRawTransactions(data: SchwabActivity[], tx?: any) {
  const accountKey = await getAccountKey();
  const database = tx || db;

  // Convert json to expected stg_transaction format
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

// Updated helper to group pending transactions by broker
export async function getPendingTransactionIdsByBroker(batchSize: number) {
  const accountKey = await getAccountKey();

  const pendingTransactions = await db
    .select({
      id: stgTransaction.id,
      brokerCode: stgTransaction.brokerCode,
    })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        inArray(stgTransaction.status, ["PENDING", "FAILED"])
      )
    )
    .orderBy(stgTransaction.brokerCode, stgTransaction.id);

  // Group by broker and split into batches
  const brokerBatches: Record<string, number[][]> = {};

  for (const tx of pendingTransactions) {
    if (!brokerBatches[tx.brokerCode]) {
      brokerBatches[tx.brokerCode] = [];
    }

    // Get the current batch for this broker
    let currentBatch =
      brokerBatches[tx.brokerCode][brokerBatches[tx.brokerCode].length - 1];

    // If no batch exists or current batch is full, create new batch
    if (!currentBatch || currentBatch.length >= batchSize) {
      currentBatch = [];
      brokerBatches[tx.brokerCode].push(currentBatch);
    }

    currentBatch.push(tx.id);
  }

  return brokerBatches;
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

  const brokerBatches = await getPendingTransactionIdsByBroker(batchSize);
  const pendingTransactionCount = await getPendingTransactionCount();

  // Process each broker's batches
  for (const [brokerCode, batches] of Object.entries(brokerBatches)) {
    for (const batchIds of batches) {
      // Call broker-specific processing function
      const batchResult = await processBrokerTransactionsBatch(
        brokerCode,
        batchIds
      );

      totalProcessed += batchResult.processed;
      totalFailed += batchResult.failed;
      allErrors.push(...batchResult.errors);

      // Update progress after each batch
      await updateSyncProgress("processing", {
        processed: totalProcessed,
        failed: totalFailed,
        remaining: pendingTransactionCount - totalProcessed - totalFailed,
      });
    }
  }

  return {
    processed: totalProcessed,
    failed: totalFailed,
    errors: allErrors,
  };
}

// Broker dispatcher function
async function processBrokerTransactionsBatch(
  brokerCode: BrokerCode,
  stgTransactionIds: number[]
) {
  switch (brokerCode) {
    case "schwab":
      return await processSchwabTransactions(stgTransactionIds);
    default:
      throw new Error(`Unsupported broker: ${brokerCode}`);
  }
}
