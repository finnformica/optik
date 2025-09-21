import { NextRequest } from "next/server";
import { getSyncProgressFromDB } from "@/lib/sync-progress";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendUpdate = async () => {
        try {
          const progress = await getSyncProgressFromDB(sessionId);
          const data = `data: ${JSON.stringify(progress)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('Error getting sync progress:', error);
          const errorData = `data: ${JSON.stringify({
            status: 'failed',
            progress: 0,
            message: 'Error retrieving progress',
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Send initial status
      sendUpdate();

      // Set up interval to send updates
      const interval = setInterval(sendUpdate, 1000);

      // Clean up when client disconnects
      const cleanup = () => {
        clearInterval(interval);
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);

      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}