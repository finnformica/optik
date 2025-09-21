import { getAccountKey } from "@/lib/auth/session";
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
  processRawTransactions,
  SchwabActivity,
} from "@/lib/db/etl/queries";
import { stgTransaction } from "@/lib/db/schema";
import {
  endSyncSession,
  getActiveSyncSession,
  getOrCreateSyncSession,
  updateSyncStatus,
  updateSyncTransactionCounts,
} from "@/lib/sync-progress";
import { and, eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// TODO: Update this to work with all broker accounts
export async function POST(request: NextRequest) {
  // Get session ID for progress tracking
  const sessionId =
    request.nextUrl.searchParams.get("sessionId") || `sync-${Date.now()}`;
  const accountKey = await getAccountKey();

  try {
    // Check for existing active sync session to prevent concurrent syncs
    const activeSession = await getActiveSyncSession(accountKey);

    if (activeSession && activeSession.sessionId !== sessionId) {
      return NextResponse.json({
        success: false,
        processed: 0,
        failed: 0,
        transactionsFetched: 0,
        sessionId: activeSession.sessionId, // Return the active session ID
      });
    }

    const schwabAuth = new SchwabAuth();
    let allTransactions: SchwabActivity[] = [];

    // Get all active Schwab broker accounts from database
    const brokerAccounts = await getActiveBrokerAccounts("schwab");

    if (brokerAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        processed: 0,
        failed: 0,
      });
    }

    // Start or resume sync session
    await getOrCreateSyncSession(sessionId);

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
          return NextResponse.json({
            success: false,
            processed: 0,
            failed: 0,
          });
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
    const pendingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(stgTransaction)
      .where(
        and(
          eq(stgTransaction.accountKey, accountKey),
          inArray(stgTransaction.status, ["PENDING", "ERROR"])
        )
      );

    const totalToProcess = Number(pendingCount[0]?.count || 0);

    // Update session with transaction count to be processed
    await updateSyncTransactionCounts(sessionId, {
      totalTransactions: totalToProcess,
    });
    await updateSyncStatus(sessionId, "PROCESSING");

    // Process all pending transactions (includes any newly inserted ones)
    let results = { processed: 0, failed: 0 };

    if (totalToProcess > 0) {
      results = await processRawTransactions();
    }

    // Update final processing counts
    await updateSyncTransactionCounts(sessionId, {
      processedTransactions: results.processed,
      failedTransactions: results.failed,
    });

    // Mark sync as completed
    endSyncSession(sessionId);

    return NextResponse.json({
      success: results.processed > 0,
      processed: results.processed,
      failed: results.failed,
      transactionsFetched: allTransactions.length,
      sessionId,
    });
  } catch (error) {
    console.error("Schwab data ingestion error:", error);
    // Mark sync as failed
    updateSyncStatus(sessionId, "FAILED");

    return NextResponse.json(
      {
        success: false,
        processed: 0,
        failed: 0,
        transactionsFetched: 0,
        sessionId,
      },
      { status: 500 }
    );
  }
}
