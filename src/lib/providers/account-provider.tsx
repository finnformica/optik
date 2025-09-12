'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DimAccount } from '@/lib/db/schema';
import { useAccount } from '@/lib/hooks/use-account';
import { AccountContextType } from '@/lib/auth/account-context';

const AccountContext = createContext<AccountContextType | null>(null);

interface AccountProviderProps {
  children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const accountHook = useAccount();
  
  const contextValue: AccountContextType = {
    currentAccount: accountHook.currentAccount,
    accounts: accountHook.accounts,
    switchAccount: accountHook.switchAccount,
    isLoading: accountHook.isLoading,
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext(): AccountContextType {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
}

// Convenience hook to get current account key for API calls
export function useCurrentAccountKey(): number | null {
  const { currentAccount } = useAccountContext();
  return currentAccount?.accountKey || null;
}