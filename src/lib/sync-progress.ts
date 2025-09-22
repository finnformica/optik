import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { NewRtmSyncProgress, rtmSyncProgress } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Helper functions to manage sync sessions
export async function startSyncSession() {
  const accountKey = await getAccountKey();

  // Insert or update table
  const values: NewRtmSyncProgress = {
    accountKey,
    status: "FETCHING",
    message: "Fetching transactions from broker...",
    startTime: new Date(),
    total: 0,
    processed: 0,
    failed: 0,
    remaining: 0,
    endTime: null,
  };

  await db.insert(rtmSyncProgress).values(values).onConflictDoUpdate({
    target: rtmSyncProgress.accountKey,
    set: values,
  });
}

export async function updateSyncStatus(
  status: "pending" | "fetching" | "processing" | "completed" | "failed"
) {
  const accountKey = await getAccountKey();

  await db
    .update(rtmSyncProgress)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "completed" || status === "failed"
        ? { endTime: new Date() }
        : {}),
    })
    .where(eq(rtmSyncProgress.accountKey, accountKey));
}

export async function updateSyncTransactionCounts(counts: {
  total?: number;
  processed?: number;
  failed?: number;
}) {
  const accountKey = await getAccountKey();

  await db
    .update(rtmSyncProgress)
    .set({ ...counts, updatedAt: new Date() })
    .where(eq(rtmSyncProgress.accountKey, accountKey));
}

export async function endSyncSession() {
  await updateSyncStatus("completed");
}

// Get active sync session for account (to prevent multiple concurrent syncs)
export async function getActiveSyncSession() {
  const accountKey = await getAccountKey();

  const [activeSession] = await db
    .select()
    .from(rtmSyncProgress)
    .where(
      and(
        eq(rtmSyncProgress.accountKey, accountKey),
        sql`${rtmSyncProgress.status} IN ('pending', 'fetching', 'processing')`,
        sql`${rtmSyncProgress.endTime} IS NULL`
      )
    )
    .limit(1);

  return activeSession;
}
