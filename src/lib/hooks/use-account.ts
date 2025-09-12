'use client';

import { useState, useEffect, useCallback } from 'react';
import { DimAccount } from '@/lib/db/schema';
import { AccountManager } from '@/lib/auth/account-context';

export function useAccount() {
  const [currentAccount, setCurrentAccount] = useState<DimAccount | null>(null);
  const [accounts, setAccounts] = useState<DimAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { accounts: userAccounts, currentAccountKey } = await AccountManager.getUserAccounts();
      setAccounts(userAccounts);

      // Determine current account - prioritize server session over localStorage
      let selectedAccount: DimAccount | null = null;
      
      if (currentAccountKey) {
        // Use account from server session
        selectedAccount = userAccounts.find(acc => acc.accountKey === currentAccountKey) || null;
      }
      
      if (!selectedAccount) {
        // Fallback to localStorage then first account
        const lastUsedAccountKey = AccountManager.getLastUsedAccountKey();
        selectedAccount = AccountManager.determineCurrentAccount(userAccounts, lastUsedAccountKey);
        
        // Update server session if we determined an account
        if (selectedAccount) {
          const result = await AccountManager.switchAccount(selectedAccount.accountKey);
          if (!result.success) {
            console.error('Failed to set initial account:', result.error);
          }
        }
      }
      
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
  }, []);

  const switchAccount = useCallback(async (accountKey: number) => {
    const account = accounts.find(acc => acc.accountKey === accountKey);
    if (!account) {
      console.error('Account not found:', accountKey);
      return { success: false, error: 'Account not found' };
    }

    // Switch account on server using server action
    const result = await AccountManager.switchAccount(accountKey);
    if (result.success) {
      setCurrentAccount(account);
      AccountManager.setLastUsedAccountKey(accountKey);
    }
    return result;
  }, [accounts]);

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