import { endpoints } from "@/lib/utils";

// Get active sync session for current user
export async function getActiveSyncSession() {
  try {
    const response = await fetch(endpoints.sync.active);

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("Error getting active sync session:", error);
    return null;
  }
}

// Check if there's an active sync session and return its ID
export async function recoverSyncSession(): Promise<string | null> {
  const activeSession = await getActiveSyncSession();
  return activeSession?.sessionId || null;
}
