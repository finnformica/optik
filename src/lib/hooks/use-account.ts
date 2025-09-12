'use client';

import { useState, useEffect, useCallback } from 'react';
import { DimAccount } from '@/lib/db/schema';
import { AccountManager } from '@/lib/auth/account-context';

export function useAccount(userId: number) {
  const [currentAccount, setCurrentAccount] = useState<DimAccount | null>(null);
  const [accounts, setAccounts] = useState<DimAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const userAccounts = await AccountManager.getUserAccounts(userId);
      setAccounts(userAccounts);

      // Determine current account
      const lastUsedAccountKey = AccountManager.getLastUsedAccountKey();
      const selectedAccount = AccountManager.determineCurrentAccount(
        userAccounts,
        lastUsedAccountKey
      );
      
      setCurrentAccount(selectedAccount);
      
      // Update localStorage with current selection
      if (selectedAccount) {
        AccountManager.setLastUsedAccountKey(selectedAccount.accountKey);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
      setCurrentAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const switchAccount = useCallback(async (accountKey: number) => {
    // Validate user has access to this account
    const hasAccess = await AccountManager.validateAccountAccess(userId, accountKey);
    if (!hasAccess) {
      console.error('User does not have access to account:', accountKey);
      return;
    }

    const account = accounts.find(acc => acc.accountKey === accountKey);
    if (account) {
      setCurrentAccount(account);
      AccountManager.setLastUsedAccountKey(accountKey);
    }
  }, [userId, accounts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return {
    currentAccount,
    accounts,
    switchAccount,
    isLoading,
    refetchAccounts: loadAccounts,
  };
}