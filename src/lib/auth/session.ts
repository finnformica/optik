import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db/config';
import { dimAccount, NewUser } from '@/lib/db/schema';
import { paths } from '@/lib/utils';


const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
  accountKey: number;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) redirect(paths.auth.signIn);
  return await verifyToken(session);
}

export async function setSession(user: NewUser, accountKey: number) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
    accountKey,
  };

  const encryptedSession = await signToken(session);

  (await cookies()).set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

export async function updateSessionAccountKey(accountKey: number) {
  const session = await getSession();
  const updatedSession: SessionData = {
    ...session,
    accountKey,
  };

  // Keep the same expiry as the current session
  const expiryDate = new Date(session.expires);
  const encryptedSession = await signToken(updatedSession);
  
  (await cookies()).set('session', encryptedSession, {
    expires: expiryDate,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
}

export async function getAccountKey() {
  const session = await getSession();
  return session.accountKey;
}

export async function getAccount() {
  const session = await getSession();

  const [account] = await db.select().from(dimAccount).where(eq(dimAccount.accountKey, session.accountKey)).limit(1);
  return account
}

export async function getUserId() {
  const session = await getSession();
  return session.user.id;
}
