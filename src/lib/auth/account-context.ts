'use client';

import { DimAccount } from '@/lib/db/schema';

const LAST_ACCOUNT_KEY = 'optik_last_account';

export type AccountContextType = {
  currentAccount: DimAccount | null;
  accounts: DimAccount[];
  switchAccount: (accountKey: number) => void;
  isLoading: boolean;
};

export class AccountManager {
  static getLastUsedAccountKey(): number | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(LAST_ACCOUNT_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  static setLastUsedAccountKey(accountKey: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LAST_ACCOUNT_KEY, accountKey.toString());
  }

  static clearLastUsedAccountKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LAST_ACCOUNT_KEY);
  }

  static determineCurrentAccount(
    accounts: DimAccount[],
    lastUsedAccountKey?: number | null
  ): DimAccount | null {
    if (!accounts || accounts.length === 0) return null;

    // 1. Try last used account from localStorage (device-specific)
    if (lastUsedAccountKey) {
      const lastUsedAccount = accounts.find(
        (account) => account.accountKey === lastUsedAccountKey
      );
      if (lastUsedAccount) return lastUsedAccount;
    }

    // 2. Fallback to first account (oldest/primary)
    return accounts[0];
  }

  static async getUserAccounts(userId: number): Promise<DimAccount[]> {
    try {
      const response = await fetch(`/api/user/accounts?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user accounts');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      return [];
    }
  }

  static async validateAccountAccess(
    userId: number,
    accountKey: number
  ): Promise<boolean> {
    try {
      const accounts = await this.getUserAccounts(userId);
      return accounts.some((account) => account.accountKey === accountKey);
    } catch (error) {
      console.error('Error validating account access:', error);
      return false;
    }
  }
}