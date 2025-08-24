'use server';

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/config";
import { userAccessTokens } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function disconnectSchwab() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const userId = session.user.id;

  try {
    await db
      .delete(userAccessTokens)
      .where(and(
        eq(userAccessTokens.userId, userId),
        eq(userAccessTokens.provider, 'schwab')
      ));
    
    redirect('/settings/connections');
  } catch (error) {
    console.error('Error disconnecting Schwab:', error);
    throw new Error('Failed to disconnect Schwab account');
  }
}

export async function connectSchwab() {
  // This would typically redirect to Schwab OAuth
  // For now, we'll just redirect to a placeholder
  redirect('/api/auth/schwab');
}
