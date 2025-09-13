'use server';

import { getUserId, updateSessionAccount } from '@/lib/auth/session';
import { getUserAccount } from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';

export async function switchAccount(accountKey: number) {
  try {
    const userId = await getUserId();
    
    if (!accountKey || typeof accountKey !== 'number') {
      return { success: false, error: 'Invalid account key' };
    }

    // Validate user has access to this account
    const account = await getUserAccount(userId, accountKey);
    if (!account) {
      return { success: false, error: 'Account not found or access denied' };
    }

    // Update session with new account
    await updateSessionAccount(accountKey);

    // Revalidate all pages to refresh with new account data
    revalidatePath('/');

    return { 
      success: true, 
      accountKey: account.accountKey,
      accountName: account.accountName 
    };
  } catch (error) {
    console.error('Error switching account:', error);
    return { success: false, error: 'Failed to switch account' };
  }
}