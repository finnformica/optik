import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountKey } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { rtmSyncProgress } from "@/lib/db/schema";

export async function GET() {
  const accountKey = await getAccountKey();

  const [data] = await db
    .select()
    .from(rtmSyncProgress)
    .where(eq(rtmSyncProgress.accountKey, accountKey));

  return NextResponse.json(data || null);
}
