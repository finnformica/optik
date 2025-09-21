import { NextRequest } from "next/server";
import { getSyncProgressFromDB } from "@/lib/sync-progress";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  try {
    const progress = await getSyncProgressFromDB(sessionId);
    return Response.json(progress);
  } catch (error) {
    console.error('Error getting sync progress:', error);
    return Response.json({
      status: 'failed',
      progress: 0,
      message: 'Error retrieving progress',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}