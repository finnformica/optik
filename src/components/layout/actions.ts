"use server";

import { z } from "zod";

import { validatedActionWithUser } from "@/lib/auth/middleware";
import { updateAccountKey, getAccountKey } from "@/lib/supabase/server";
import { getUserRole, getAccountLimitForRole, getUserAccounts, getUser } from "@/lib/db/queries";
import { db } from "@/lib/db/config";
import { dimAccount } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const createAccountSchema = z.object({
  accountName: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be less than 100 characters"),
});

export const createAccount = validatedActionWithUser(
  createAccountSchema,
  async (data, _, user, supabaseUser) => {
    const { accountName } = data;

    // Check user's role and account limits
    const userRole = await getUserRole();
    const accountLimit = getAccountLimitForRole(userRole);
    const currentAccounts = await getUserAccounts();

    // Enforce account limits
    if (currentAccounts.length >= accountLimit) {
      if (userRole === 'basic') {
        return {
          error: `Basic plan allows only ${accountLimit} account. Upgrade to Pro to add more accounts.`
        };
      } else if (userRole === 'pro') {
        return {
          error: `${userRole} plan allows up to ${accountLimit} accounts. You currently have ${currentAccounts.length}.`
        };
      }
    }

    await db.insert(dimAccount).values({
      userId: user.id,
      accountName,
      accountType: "INDIVIDUAL",
      currency: "USD",
      isActive: true,
    });

    return { success: "Account created successfully." };
  },
);

const updateAccountSchema = z.object({
  accountKey: z.string().transform(Number),
  accountName: z
    .string()
    .min(1, "Account name is required")
    .max(100, "Account name must be less than 100 characters"),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user, supabaseUser) => {
    const { accountKey, accountName } = data;

    await db
      .update(dimAccount)
      .set({
        accountName,
        updatedAt: new Date(),
      })
      .where(eq(dimAccount.accountKey, accountKey));

    return { success: "Account updated successfully." };
  },
);

const deleteAccountSchema = z.object({
  accountKey: z.string().transform(Number),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user, supabaseUser) => {
    const { accountKey } = data;

    const currentAccountKey = await getAccountKey();

    if (currentAccountKey === accountKey) {
      return { error: "Current account cannot be deleted." };
    }

    await db
      .update(dimAccount)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(dimAccount.accountKey, accountKey));

    return { success: "Account deleted successfully." };
  },
);

const switchAccountSchema = z.object({
  accountKey: z.string().transform(Number),
});

export const switchAccount = validatedActionWithUser(
  switchAccountSchema,
  async (data, _, user, supabaseUser) => {
    const { accountKey } = data;

    // Verify the account belongs to the user
    const [account] = await db
      .select()
      .from(dimAccount)
      .where(eq(dimAccount.accountKey, accountKey))
      .limit(1);

    if (!account || account.userId !== user.id) {
      return { error: "Account not found or access denied." };
    }

    // Update the user metadata with the new account key
    await updateAccountKey(accountKey);

    return { success: "Account switched successfully." };
  },
);

// Function to check if user can downgrade based on current account count
export async function checkDowngradeEligibility(targetRole: 'basic' | 'pro'): Promise<{ canDowngrade: boolean; message?: string; excessAccounts?: number }> {
  const currentAccounts = await getUserAccounts();
  const targetLimit = getAccountLimitForRole(targetRole);

  if (currentAccounts.length > targetLimit) {
    const excessAccounts = currentAccounts.length - targetLimit;
    return {
      canDowngrade: false,
      message: `Cannot downgrade to ${targetRole}. You have ${currentAccounts.length} accounts but ${targetRole} plan allows only ${targetLimit}. Please delete ${excessAccounts} account(s) first.`,
      excessAccounts
    };
  }

  return { canDowngrade: true };
}

// Function to check if user has active subscription before account deletion
export async function checkAccountDeletionEligibility(): Promise<{ canDelete: boolean; hasActiveSubscription: boolean; message?: string }> {
  const user = await getUser();
  if (!user) {
    return { canDelete: true, hasActiveSubscription: false };
  }

  // Check if user has active subscription
  const hasActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  if (hasActiveSubscription) {
    return {
      canDelete: false,
      hasActiveSubscription: true,
      message: `You have an active ${user.subscriptionStatus} subscription. Please cancel your subscription first or contact support to delete your account.`
    };
  }

  return { canDelete: true, hasActiveSubscription: false };
}
