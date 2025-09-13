'use server';

import { z } from 'zod';

import { validatedActionWithUser } from '@/lib/auth/middleware';
import { updateSessionAccountKey } from '@/lib/auth/session';
import { db } from '@/lib/db/config';
import { dimAccount } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const createAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(100, 'Account name must be less than 100 characters'),
});

export const createAccount = validatedActionWithUser(
  createAccountSchema,
  async (data, _, user) => {
    const { accountName } = data;

    await db.insert(dimAccount).values({
      userId: user.id,
      accountName,
      accountType: 'INDIVIDUAL',
      currency: 'USD',
      isActive: true,
    });

    return { success: 'Account created successfully.' };
  }
);

const updateAccountSchema = z.object({
  accountKey: z.string().transform(Number),
  accountName: z.string().min(1, 'Account name is required').max(100, 'Account name must be less than 100 characters'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { accountKey, accountName } = data;

    await db
      .update(dimAccount)
      .set({
        accountName,
        updatedAt: new Date(),
      })
      .where(eq(dimAccount.accountKey, accountKey));

    return { success: 'Account updated successfully.' };
  }
);

const deleteAccountSchema = z.object({
  accountKey: z.number(),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { accountKey } = data;

    await db
      .update(dimAccount)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(dimAccount.accountKey, accountKey));

    return { success: 'Account deleted successfully.' };
  }
);

const switchAccountSchema = z.object({
  accountKey: z.string().transform(Number),
});

export const switchAccount = validatedActionWithUser(
  switchAccountSchema,
  async (data, _, user) => {
    const { accountKey } = data;

    // Verify the account belongs to the user
    const account = await db
      .select()
      .from(dimAccount)
      .where(eq(dimAccount.accountKey, accountKey))
      .limit(1);

    if (account.length === 0 || account[0].userId !== user.id) {
      return { error: 'Account not found or access denied.' };
    }

    // Update the session with the new account key
    await updateSessionAccountKey(accountKey);

    return { success: 'Account switched successfully.' };
  }
);
