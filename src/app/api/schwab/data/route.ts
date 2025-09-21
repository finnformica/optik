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
import { NextRequest, NextResponse } from "next/server";
import { startSyncSession, updateSyncStatus, endSyncSession, getActiveSyncSession, getOrCreateSyncSession } from "@/lib/sync-progress";
import { getAccountKey } from "@/lib/auth/session";

// TODO: Update this to work with all broker accounts
export async function POST(request: NextRequest) {
  // Get session ID for progress tracking
  const sessionId = request.nextUrl.searchParams.get('sessionId') || `sync-${Date.now()}`;
  const accountKey = await getAccountKey();

  try {
    // Check for existing active sync session to prevent concurrent syncs
    const activeSession = await getActiveSyncSession(accountKey, 'schwab');

    if (activeSession && activeSession.sessionId !== sessionId) {
      return NextResponse.json({
        success: false,
        processed: 0,
        failed: 0,
        transactionsFetched: 0,
        sessionId: activeSession.sessionId, // Return the active session ID
        alert: {
          variant: "warning",
          message: `Sync already in progress. Use session ID: ${activeSession.sessionId}`,
        },
      });
    }

    // Start or resume sync session
    await getOrCreateSyncSession(sessionId, 'schwab');

    const schwabAuth = new SchwabAuth();
    let allTransactions: SchwabActivity[] = [];

    // Get all active Schwab broker accounts from database
    const brokerAccounts = await getActiveBrokerAccounts("schwab");

    if (brokerAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        processed: 0,
        failed: 0,
        alert: {
          variant: "destructive",
          message:
            "No active Schwab accounts found. Please re-authenticate with Schwab.",
        },
      });
    }

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
            alert: {
              variant: "destructive",
              message: accountError.message,
            },
          });
        }

        console.error(
          `Failed to fetch transactions for account ${account.brokerAccountNumber}:`,
          accountError
        );
        // Continue with other accounts even if one fails
      }
    }

    // Update status to processing
    updateSyncStatus(sessionId, 'PROCESSING');

    // Process all fetched transactions in optimized chunks
    let results;
    if (allTransactions.length > 0) {
      // 1. Insert raw broker data in its own transaction
      await db.transaction(async (tx) => {
        await insertRawTransactions(allTransactions, tx);
      });
    }

    // 2. Process pending transactions without transaction for real-time progress
    results = await processRawTransactions();

    // Mark sync as completed
    endSyncSession(sessionId);

    // Determine alert based on results
    let alert;
    if (allTransactions.length === 0) {
      alert = {
        variant: "info",
        message: "Sync completed - no new transactions found.",
      };
    } else if (results.processed > 0 && results.failed === 0) {
      alert = {
        variant: "success",
        message: `Successfully processed ${allTransactions.length} transactions.`,
      };
    } else if (results.processed > 0 && results.failed > 0) {
      alert = {
        variant: "warning",
        message: `Successfully processed ${results.processed} transactions, but ${results.failed} failed. Check logs for details.`,
      };
    } else if (results.processed === 0 && results.failed > 0) {
      alert = {
        variant: "destructive",
        message: `Failed to process ${results.failed} transactions. ${
          results.errors.length > 0
            ? results.errors.join(", ")
            : "Check logs for details."
        }`,
      };
    } else if (results.errors && results.errors.length > 0) {
      alert = {
        variant: "warning",
        message: `Sync completed with issues: ${results.errors.join(", ")}`,
      };
    } else {
      alert = {
        variant: "success",
        message: "Sync completed successfully.",
      };
    }

    return NextResponse.json({
      success: results.processed > 0,
      processed: results.processed,
      failed: results.failed,
      transactionsFetched: allTransactions.length,
      sessionId,
      alert,
    });
  } catch (error) {
    console.error("Schwab data ingestion error:", error);
    // Mark sync as failed
    updateSyncStatus(sessionId, 'FAILED');

    return NextResponse.json(
      {
        success: false,
        processed: 0,
        failed: 0,
        transactionsFetched: 0,
        sessionId,
        alert: {
          variant: "destructive",
          message: `Sync failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
        },
      },
      { status: 500 }
    );
  }
}
