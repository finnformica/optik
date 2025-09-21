import { endpoints } from "@/lib/utils";
import { fetcher } from "./fetchers";

// Check if there's an active sync session and return its ID
export async function recoverSyncSession(): Promise<string | null> {
  try {
    const response = await fetcher(endpoints.sync.active);

    if (!response || !response.ok) return null;

    const activeSession = await response.json();
    return activeSession?.sessionId || null;
  } catch (error) {
    console.error("Error getting active sync session:", error);
    return null;
  }
}
