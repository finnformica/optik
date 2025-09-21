import { getAccountKey } from "@/lib/auth/session";
import { getActiveSyncSession } from "@/lib/sync-progress";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accountKey = await getAccountKey();
    const activeSession = await getActiveSyncSession(accountKey);

    if (!activeSession) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      sessionId: activeSession.sessionId,
      status: activeSession.status,
      startedAt: activeSession.startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error getting active sync session: ${error}` },
      { status: 500 }
    );
  }
}
