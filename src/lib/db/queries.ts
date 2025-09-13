import { getCurrentAccountKey, getSession, verifyToken } from '@/lib/auth/session';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from './config';
import { dimAccount, users } from './schema';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getUserAccounts(userId: number) {
  const accounts = await db
    .select()
    .from(dimAccount)
    .where(and(eq(dimAccount.userId, userId), eq(dimAccount.isActive, true)))
    .orderBy(dimAccount.createdAt);

  return accounts;
}

export async function getUserAccount(userId: number, accountKey: number) {
  const account = await db
    .select()
    .from(dimAccount)
    .where(
      and(
        eq(dimAccount.userId, userId),
        eq(dimAccount.accountKey, accountKey),
        eq(dimAccount.isActive, true)
      )
    )
    .limit(1);

  return account.length > 0 ? account[0] : null;
}

export async function getCurrentAccountForUser(userId: number, requestedAccountKey?: number) {
  const userAccounts = await getUserAccounts(userId);
  
  if (!userAccounts || userAccounts.length === 0) {
    return null;
  }

  // If specific account requested, validate user has access
  if (requestedAccountKey) {
    const requestedAccount = userAccounts.find(
      (account) => account.accountKey === requestedAccountKey
    );
    return requestedAccount || null;
  }

  // Fallback to first account (oldest/primary)
  return userAccounts[0];
}

export async function getCurrentAccount() {
  const session = await getSession();

  // Try to get account key from session
  const sessionAccountKey = await getCurrentAccountKey();
  
  if (sessionAccountKey) {
    // Validate user has access to this account
    const account = await getUserAccount(session.user.id, sessionAccountKey);
    if (account) return account;
  }

  // Fallback to first account if session account is invalid
  const accounts = await getUserAccounts(session.user.id);
  return accounts.length > 0 ? accounts[0] : null;
}





