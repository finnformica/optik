"use server";

import { getAccountKey } from "@/lib/auth/session";
import { SchwabAuth } from "@/lib/connections/schwab/oauth";
import { db } from "@/lib/db/config";
import { dimAccountAccessToken } from "@/lib/db/schema";
import { paths } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function disconnectSchwab() {
  const accountKey = await getAccountKey();

  try {
    await db
      .delete(dimAccountAccessToken)
      .where(
        and(
          eq(dimAccountAccessToken.accountKey, accountKey),
          eq(dimAccountAccessToken.brokerCode, "schwab"),
        ),
      );

    // Revalidate the connections page to show updated state
    revalidatePath(paths.settings.connections);
  } catch (error) {
    throw new Error("Failed to disconnect Schwab account");
  }
}

export async function connectSchwab() {
  const schwabAuth = new SchwabAuth();

  const authUrl = schwabAuth.getAuthorizationUrl();
  redirect(authUrl);
}
