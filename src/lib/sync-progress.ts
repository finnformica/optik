import { getCurrentAccountKey } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import { NewRtmSyncProgress, rtmSyncProgress } from "@/lib/db/schema";
import { SyncStatus } from "@/types/sync-progress";
import { and, eq, sql } from "drizzle-orm";

// Helper functions to manage sync sessions
export async function startSyncSession() {
  const accountKey = await getCurrentAccountKey();

  // Insert or update table
  const values: NewRtmSyncProgress = {
    accountKey,
    status: "fetching",
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

export async function updateSyncProgress(
  status: SyncStatus,
  counts?: {
    total?: number;
    processed?: number;
    failed?: number;
    remaining?: number;
  }
) {
  const accountKey = await getCurrentAccountKey();

  await db
    .update(rtmSyncProgress)
    .set({
      status,
      ...counts,
      updatedAt: new Date(),
      ...(status === "completed" || status === "failed"
        ? { endTime: new Date() }
        : {}),
    })
    .where(eq(rtmSyncProgress.accountKey, accountKey));
}

// Get active sync session for account (to prevent multiple concurrent syncs)
export async function getActiveSyncSession() {
  const accountKey = await getCurrentAccountKey();

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
