import { NextRequest, NextResponse } from "next/server";
import { getActiveSyncSession } from "@/lib/sync-progress";
import { getAccountKey } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const brokerCode = request.nextUrl.searchParams.get('brokerCode') || 'schwab';
    const accountKey = await getAccountKey();

    const activeSession = await getActiveSyncSession(accountKey, brokerCode);

    if (!activeSession) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      sessionId: activeSession.sessionId,
      status: activeSession.status,
      startedAt: activeSession.startedAt,
    });
  } catch (error) {
    console.error('Error getting active sync session:', error);
    return NextResponse.json(null, { status: 500 });
  }
}