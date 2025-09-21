import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { stgSyncSession } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Get real-time progress from database
export async function getSyncProgressFromDB(sessionId: string) {
  try {
    // Get sync session from database
    const [syncSession] = await db
      .select()
      .from(stgSyncSession)
      .where(eq(stgSyncSession.sessionId, sessionId))
      .limit(1);

    if (!syncSession) {
      return {
        status: "idle",
        progress: 0,
        message: "Ready to sync",
        total: 0,
        processed: 0,
        failed: 0,
      };
    }
    // Get transaction counts from the sync session (stored during sync process)
    const total = syncSession.totalTransactions || 0;
    const processed = syncSession.processedTransactions || 0;
    const failed = syncSession.failedTransactions || 0;
    const remaining = total - processed - failed;

    let progress = 0;
    let message = "Ready to sync";
    let status = syncSession.status.toLowerCase();

    if (total > 0) {
      progress = Math.round(((processed + failed) / total) * 100);

      if (remaining > 0) {
        message = `Processing ${remaining} transactions...`;
      } else {
        if (failed > 0) {
          message = `Completed with ${failed} failures`;
        } else {
          message = "All transactions processed successfully";
        }
      }
    } else if (syncSession.status === "FETCHING") {
      message = "Fetching transactions from broker...";
    } else if (syncSession.status === "PENDING") {
      message = "Starting sync...";
    }

    // Include start time from session
    const startTime = syncSession.createdAt.getTime();
    const endTime = syncSession.completedAt?.getTime();

    // Handle alerts for completed/failed syncs using existing patterns
    let alert = null;
    if (syncSession.status === "COMPLETED") {
      if (total === 0) {
        alert = {
          variant: "info" as const,
          message: "Sync completed - no new transactions found.",
        };
      } else if (processed > 0 && failed === 0) {
        alert = {
          variant: "success" as const,
          message: `Successfully processed ${total} transactions.`,
        };
      } else if (processed > 0 && failed > 0) {
        alert = {
          variant: "warning" as const,
          message: `Successfully processed ${processed} transactions, but ${failed} failed. Check logs for details.`,
        };
      } else if (processed === 0 && failed > 0) {
        alert = {
          variant: "destructive" as const,
          message: `Failed to process ${failed} transactions. Check logs for details.`,
        };
      } else {
        alert = {
          variant: "success" as const,
          message: "Sync completed successfully.",
        };
      }
    } else if (syncSession.status === "FAILED") {
      alert = {
        variant: "destructive" as const,
        message: "Sync failed: Unknown error occurred",
      };
    }

    return {
      status,
      progress,
      message,
      total,
      processed,
      failed,
      remaining,
      startTime,
      endTime,
      alert,
    };
  } catch (error) {
    return {
      status: "failed",
      progress: 0,
      message: `Error retrieving progress: ${error}`,
      total: 0,
      processed: 0,
      failed: 0,
    };
  }
}

// Helper functions to manage sync sessions
export async function startSyncSession(sessionId: string) {
  const accountKey = await getAccountKey();

  // Set expiry to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await db
    .insert(stgSyncSession)
    .values({
      sessionId,
      accountKey,
      status: "FETCHING",
      expiresAt,
    })
    .onConflictDoUpdate({
      target: stgSyncSession.sessionId,
      set: {
        status: "FETCHING",
        updatedAt: new Date(),
      },
    });
}

export async function updateSyncStatus(
  sessionId: string,
  status: "PENDING" | "FETCHING" | "PROCESSING" | "COMPLETED" | "FAILED"
) {
  await db
    .update(stgSyncSession)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "COMPLETED" || status === "FAILED"
        ? { completedAt: new Date() }
        : {}),
    })
    .where(eq(stgSyncSession.sessionId, sessionId));
}

export async function updateSyncTransactionCounts(
  sessionId: string,
  counts: {
    totalTransactions?: number;
    processedTransactions?: number;
    failedTransactions?: number;
  }
) {
  await db
    .update(stgSyncSession)
    .set({
      ...counts,
      updatedAt: new Date(),
    })
    .where(eq(stgSyncSession.sessionId, sessionId));
}

export async function endSyncSession(sessionId: string) {
  await updateSyncStatus(sessionId, "COMPLETED");
}

export async function getOrCreateSyncSession(sessionId: string) {
  // Check if session exists and is not expired
  const [existingSession] = await db
    .select()
    .from(stgSyncSession)
    .where(
      and(
        eq(stgSyncSession.sessionId, sessionId),
        sql`${stgSyncSession.expiresAt} > NOW()`
      )
    )
    .limit(1);

  if (existingSession) {
    return existingSession;
  }

  // Create new session if doesn't exist or expired
  await startSyncSession(sessionId);

  const [newSession] = await db
    .select()
    .from(stgSyncSession)
    .where(eq(stgSyncSession.sessionId, sessionId))
    .limit(1);

  return newSession;
}

// Get active sync session for account (to prevent multiple concurrent syncs)
// Now checks for ANY active sync regardless of broker
export async function getActiveSyncSession(accountKey: number) {
  const [activeSession] = await db
    .select()
    .from(stgSyncSession)
    .where(
      and(
        eq(stgSyncSession.accountKey, accountKey),
        sql`${stgSyncSession.status} IN ('PENDING', 'FETCHING', 'PROCESSING')`,
        sql`${stgSyncSession.expiresAt} > NOW()`
      )
    )
    .limit(1);

  return activeSession;
}
