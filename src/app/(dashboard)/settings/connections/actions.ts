'use server';

import { getAccountKey } from "@/lib/auth/session";
import { SchwabAuth } from "@/lib/connections/schwab/oauth";
import { db } from "@/lib/db/config";
import { dimAccountAccessTokens } from "@/lib/db/schema";
import { paths } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function disconnectSchwab() {
  const accountKey = await getAccountKey();

  try {
    await db
      .delete(dimAccountAccessTokens)
      .where(and(
        eq(dimAccountAccessTokens.accountKey, accountKey),
        eq(dimAccountAccessTokens.brokerCode, 'schwab')
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
