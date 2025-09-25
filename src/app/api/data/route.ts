import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountKey } from "@/lib/supabase/server";
import {
  SchwabAuth,
  SchwabAuthenticationError,
  SchwabTokenRefreshError,
} from "@/lib/connections/schwab/oauth";
import { db } from "@/lib/db/config";
import {
  getActiveBrokerAccounts,
  getLastTransactionDate,
} from "@/lib/db/etl/broker-accounts";
import {
  insertRawTransactions,
  processRawTransactionsWithProgress,
} from "@/lib/db/etl/queries";
import { SchwabActivity } from "@/lib/db/etl/schwab";
import { stgTransaction } from "@/lib/db/schema";
import {
  getActiveSyncSession,
  startSyncSession,
  updateSyncProgress,
} from "@/lib/sync-progress";

export async function POST() {
  try {
    // Check for existing active sync session to prevent concurrent syncs
    const activeSession = await getActiveSyncSession();

    if (activeSession) {
      // In progress, return 202
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // Start sync session
    await startSyncSession();

    const schwabAuth = new SchwabAuth();
    let allTransactions: SchwabActivity[] = [];

    // Get all active Schwab broker accounts from database
    const brokerAccounts = await getActiveBrokerAccounts("schwab");

    if (brokerAccounts.length === 0) {
      // End sync session
      await updateSyncProgress("completed");

      return NextResponse.json(
        {
          message:
            "No connected Schwab accounts found, please connect your account",
          success: false,
        },
        { status: 404 }
      );
    }

    await updateSyncProgress("fetching");

    // Fetch transactions for each broker account
    for (const account of brokerAccounts) {
      try {
        // Get the last transaction date for incremental sync
        const lastTransactionDate = await getLastTransactionDate("schwab");

        // Fetch new transactions from Schwab API
        const accountTransactions = await schwabAuth.getTransactionHistory(
          account.brokerAccountHash,
          lastTransactionDate,
          new Date()
        );

        if (accountTransactions.length > 0) {
          allTransactions.push(...accountTransactions);
        }
      } catch (accountError) {
        // Handle authentication errors specially - these require user action
        if (
          accountError instanceof SchwabAuthenticationError ||
          accountError instanceof SchwabTokenRefreshError
        ) {
          await updateSyncProgress("failed");

          return NextResponse.json(
            {
              message:
                "Error fetching transactions, please re-authenticate with Schwab",
              success: false,
            },
            { status: 400 }
          );
        }

        console.error(
          `Failed to fetch transactions for account ${account.brokerAccountNumber}:`,
          accountError
        );
        // Continue with other accounts even if one fails
      }
    }

    // Insert new transactions into staging table
    if (allTransactions.length > 0) {
      await db.transaction(async (tx) => {
        await insertRawTransactions(allTransactions, tx);
      });
    }

    // Get the count of pending transactions to process
    const accountKey = await getAccountKey();
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stgTransaction)
      .where(
        and(
          eq(stgTransaction.accountKey, accountKey),
          inArray(stgTransaction.status, ["PENDING", "ERROR"])
        )
      )
      .limit(1);

    // Update session with transaction count to be processed
    const total = pendingCount.count;
    await updateSyncProgress("processing", { total });

    // Process all pending transactions with real-time progress updates
    let results = { processed: 0, failed: 0 };

    if (total > 0) {
      const batchSize = 10;
      results = await processRawTransactionsWithProgress(batchSize);
    }

    // Mark sync as completed
    await updateSyncProgress("completed", {
      processed: results.processed,
      failed: results.failed,
      remaining: total - results.processed - results.failed,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Schwab data ingestion error:", error);
    // Mark sync as failed
    await updateSyncProgress("failed");

    return NextResponse.json(
      {
        success: false,
        message: "Error syncing Schwab transactions",
      },
      { status: 500 }
    );
  }
}
