import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db/config";
import { stgTransaction } from "@/lib/db/schema";
import { getAccountKey } from "@/lib/supabase/server";
import { updateSyncProgress } from "@/lib/sync-progress";
import { BrokerCode } from "@/types/broker";
import { processSchwabTransactions, SchwabActivity } from "./schwab";
import { processCsvTransactions } from "./csv-transactions";

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

// Updated helper to group pending transactions by broker and data source
async function getPendingTransactionIdsByBrokerAndSource(batchSize: number) {
  const accountKey = await getAccountKey();

  const pendingTransactions = await db
    .select({
      id: stgTransaction.id,
      brokerCode: stgTransaction.brokerCode,
      dataSource: stgTransaction.dataSource,
    })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        inArray(stgTransaction.status, ["PENDING", "FAILED"]),
      ),
    )
    .orderBy(stgTransaction.brokerCode, stgTransaction.dataSource, stgTransaction.id);

  // Group by broker+dataSource and split into batches
  const brokerSourceBatches: Record<string, number[][]> = {};

  for (const tx of pendingTransactions) {
    const key = `${tx.brokerCode}-${tx.dataSource}`;
    if (!brokerSourceBatches[key]) {
      brokerSourceBatches[key] = [];
    }

    // Get the current batch for this broker+source combination
    let currentBatch =
      brokerSourceBatches[key][brokerSourceBatches[key].length - 1];

    // If no batch exists or current batch is full, create new batch
    if (!currentBatch || currentBatch.length >= batchSize) {
      currentBatch = [];
      brokerSourceBatches[key].push(currentBatch);
    }

    currentBatch.push(tx.id);
  }

  return brokerSourceBatches;
}

async function getPendingTransactionCount() {
  const accountKey = await getAccountKey();

  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        inArray(stgTransaction.status, ["PENDING", "FAILED"]),
      ),
    )
    .limit(1);
  return pendingCount.count;
}

// Updated batch processor with progress tracking
export async function processRawTransactionsWithProgress(batchSize: number) {
  let totalProcessed = 0;
  let totalFailed = 0;
  let allErrors: any[] = [];

  const brokerSourceBatches = await getPendingTransactionIdsByBrokerAndSource(batchSize);
  const pendingTransactionCount = await getPendingTransactionCount();

  // Process each broker+source combination's batches
  for (const [brokerSourceKey, batches] of Object.entries(brokerSourceBatches)) {
    const [brokerCode, dataSource] = brokerSourceKey.split('-');

    for (const batchIds of batches) {
      // Call broker+source-specific processing function
      const batchResult = await processBrokerTransactionsBatch(
        brokerCode,
        dataSource,
        batchIds,
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

// Broker+DataSource dispatcher function
async function processBrokerTransactionsBatch(
  brokerCode: BrokerCode,
  dataSource: string,
  stgTransactionIds: number[],
) {
  // For CSV imports, use universal CSV processor regardless of broker
  if (dataSource === "csv") {
    return await processCsvTransactions(stgTransactionIds);
  }

  // For API data, use broker-specific processors
  switch (brokerCode) {
    case "schwab":
      return await processSchwabTransactions(stgTransactionIds);
    default:
      throw new Error(`Unsupported broker for API data: ${brokerCode}`);
  }
}
