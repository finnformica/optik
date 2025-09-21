import { db } from "@/lib/db/config";
import { stgTransaction, stgSyncSession } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getAccountKey } from "@/lib/auth/session";

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
        status: 'idle',
        progress: 0,
        message: 'Ready to sync',
        total: 0,
        processed: 0,
        failed: 0,
      };
    }
    // Get transaction counts by status for this account
    const statusCounts = await db
      .select({
        status: stgTransaction.status,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(stgTransaction)
      .where(eq(stgTransaction.accountKey, syncSession.accountKey))
      .groupBy(stgTransaction.status);

    const counts = {
      PENDING: 0,
      PROCESSED: 0,
      ERROR: 0,
    };

    statusCounts.forEach(row => {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = Number(row.count);
      }
    });

    const total = counts.PENDING + counts.PROCESSED + counts.ERROR;
    const processed = counts.PROCESSED;
    const failed = counts.ERROR;
    const remaining = counts.PENDING;

    let progress = 0;
    let message = 'Ready to sync';
    let status = syncSession.status.toLowerCase();

    if (total > 0) {
      progress = Math.round(((processed + failed) / total) * 100);

      if (remaining > 0) {
        message = `Processing ${remaining} transactions...`;
      } else {
        if (failed > 0) {
          message = `Completed with ${failed} failures`;
        } else {
          message = 'All transactions processed successfully';
        }
      }
    } else if (syncSession.status === 'FETCHING') {
      message = 'Fetching transactions from broker...';
    } else if (syncSession.status === 'PENDING') {
      message = 'Starting sync...';
    }

    return {
      status,
      progress,
      message,
      total,
      processed,
      failed,
      remaining,
    };
  } catch (error) {
    console.error('Database error in getSyncProgressFromDB:', error);
    return {
      status: 'failed',
      progress: 0,
      message: 'Error retrieving progress',
      total: 0,
      processed: 0,
      failed: 0,
    };
  }
}

// Helper functions to manage sync sessions
export async function startSyncSession(sessionId: string, brokerCode: string = 'schwab') {
  const accountKey = await getAccountKey();

  // Set expiry to 1 hour from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await db
    .insert(stgSyncSession)
    .values({
      sessionId,
      accountKey,
      brokerCode,
      status: 'FETCHING',
      expiresAt,
    })
    .onConflictDoUpdate({
      target: stgSyncSession.sessionId,
      set: {
        status: 'FETCHING',
        updatedAt: new Date(),
      },
    });
}

export async function updateSyncStatus(sessionId: string, status: 'PENDING' | 'FETCHING' | 'PROCESSING' | 'COMPLETED' | 'FAILED') {
  await db
    .update(stgSyncSession)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === 'COMPLETED' || status === 'FAILED' ? { completedAt: new Date() } : {}),
    })
    .where(eq(stgSyncSession.sessionId, sessionId));
}

export async function endSyncSession(sessionId: string) {
  await updateSyncStatus(sessionId, 'COMPLETED');
}

export async function getOrCreateSyncSession(sessionId: string, brokerCode: string = 'schwab') {
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
  await startSyncSession(sessionId, brokerCode);

  const [newSession] = await db
    .select()
    .from(stgSyncSession)
    .where(eq(stgSyncSession.sessionId, sessionId))
    .limit(1);

  return newSession;
}

// Get active sync session for account (to prevent multiple concurrent syncs)
export async function getActiveSyncSession(accountKey: number, brokerCode: string) {
  const [activeSession] = await db
    .select()
    .from(stgSyncSession)
    .where(
      and(
        eq(stgSyncSession.accountKey, accountKey),
        eq(stgSyncSession.brokerCode, brokerCode),
        sql`${stgSyncSession.status} IN ('PENDING', 'FETCHING', 'PROCESSING')`,
        sql`${stgSyncSession.expiresAt} > NOW()`
      )
    )
    .limit(1);

  return activeSession;
}