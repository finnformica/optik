'use client';

import { useState } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccountContext } from '@/lib/providers/account-provider';

export function AccountSwitcher() {
  const { currentAccount, accounts, switchAccount, isLoading } = useAccountContext();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleAccountSwitch = async (accountKey: number) => {
    if (accountKey === currentAccount?.accountKey) return;
    
    setIsSwitching(true);
    try {
      const result = await switchAccount(accountKey);
      if (!result.success) {
        console.error('Failed to switch account:', result.error);
      }
    } catch (error) {
      console.error('Error switching account:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-2">
        <div className="h-10 bg-gray-800 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="w-full px-2">
        <div className="text-xs text-gray-400 text-center py-2">
          No accounts found
        </div>
      </div>
    );
  }

  // If only one account, show it without dropdown
  if (accounts.length === 1) {
    return (
      <div className="w-full px-2 mb-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {currentAccount?.accountName || 'Unknown Account'}
            </div>
            <div className="text-xs text-gray-400">
              {currentAccount?.accountType || 'Individual'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-2 hover:bg-gray-800"
            disabled={isSwitching}
          >
            <div className="flex items-center gap-2 w-full">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-white truncate">
                  {currentAccount?.accountName || 'Select Account'}
                </div>
                <div className="text-xs text-gray-400">
                  {currentAccount?.accountType || 'No account selected'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="start" side="right">
          <DropdownMenuLabel className="text-gray-300">Switch Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700" />
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.accountKey}
              onClick={() => handleAccountSwitch(account.accountKey)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 focus:bg-gray-700"
              disabled={isSwitching}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {account.accountName}
                </div>
                <div className="text-xs text-gray-400">
                  {account.accountType}
                </div>
              </div>
              {currentAccount?.accountKey === account.accountKey && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}