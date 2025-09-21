import { endpoints } from "@/lib/utils";
import { fetcher } from "./fetchers";

// Get active sync session for current user
export async function getActiveSyncSession(brokerCode: string = 'schwab') {
  try {
    const response = await fetch(`${endpoints.sync.active}?brokerCode=${brokerCode}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting active sync session:', error);
    return null;
  }
}

// Check if there's an active sync session and return its ID
export async function recoverSyncSession(brokerCode: string = 'schwab'): Promise<string | null> {
  const activeSession = await getActiveSyncSession(brokerCode);
  return activeSession?.sessionId || null;
}