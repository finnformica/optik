'use server';

import { getSession } from "@/lib/auth/session";
import { SchwabAuth } from "@/lib/connections/schwab/oauth";
import { db } from "@/lib/db/config";
import { userAccessTokens } from "@/lib/db/schema";
import { paths } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function disconnectSchwab() {
  const session = await getSession();
  const userId = session.user.id;

  try {
    await db
      .delete(userAccessTokens)
      .where(and(
        eq(userAccessTokens.userId, userId),
        eq(userAccessTokens.brokerCode, 'schwab')
      ));
    
    // Revalidate the connections page to show updated state
    revalidatePath(paths.settings.connections);
  } catch (error) {
    throw new Error('Failed to disconnect Schwab account');
  }
}

export async function connectSchwab() {
  const schwabAuth = new SchwabAuth()
  
  const authUrl = schwabAuth.getAuthorizationUrl()
  redirect(authUrl)
}
