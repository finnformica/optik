import { getAuthenticatedUser } from "@/lib/supabase/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "./config";
import { dimAccount, dimUser } from "./schema";

export async function getUser() {
  try {
    const supabaseUser = await getAuthenticatedUser();

    const [user] = await db
      .select()
      .from(dimUser)
      .where(and(eq(dimUser.email, supabaseUser.email!), isNull(dimUser.deletedAt)))
      .limit(1);

    return user || null;
  } catch {
    return null;
  }
}

export async function getUserAccounts() {
  const user = await getUser();
  if (!user) return [];

  const accounts = await db
    .select()
    .from(dimAccount)
    .where(
      and(
        eq(dimAccount.userId, user.id),
        eq(dimAccount.isActive, true),
      ),
    )
    .orderBy(asc(dimAccount.accountKey));

  return accounts;
}
