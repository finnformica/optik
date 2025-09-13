'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccountContext } from '@/lib/providers/account-provider';
import { DimAccount } from '@/lib/db/schema';

export default function AccountsPage() {
  const { accounts, currentAccount, switchAccount } = useAccountContext();
  const [isCreating, setIsCreating] = useState(false);

  const handleSwitchAccount = async (accountKey: number) => {
    if (accountKey === currentAccount?.accountKey) return;
    
    try {
      await switchAccount(accountKey);
    } catch (error) {
      console.error('Failed to switch account:', error);
    }
  };

  const renderAccountCard = (account: DimAccount) => {
    const isCurrentAccount = currentAccount?.accountKey === account.accountKey;
    
    return (
      <Card 
        key={account.accountKey} 
        className={`bg-gray-800/50 border-gray-700 cursor-pointer transition-all hover:bg-gray-800/70 ${
          isCurrentAccount ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => handleSwitchAccount(account.accountKey)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {account.accountName}
                </h3>
                <p className="text-sm text-gray-400 mb-2">
                  {account.accountType} • {account.currency}
                </p>
                {isCurrentAccount && (
                  <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                    Current Account
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement edit functionality
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              
              {!isCurrentAccount && accounts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement delete functionality
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Account Management</h1>
          <p className="text-gray-400">
            Manage your investment accounts. Each account can have its own broker connections and transaction history.
          </p>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Current Account Info */}
      {currentAccount && (
        <Card className="bg-blue-900/20 border-blue-700/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Current Active Account</CardTitle>
            <CardDescription className="text-blue-300">
              All dashboard data and transactions are currently showing for this account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  {currentAccount.accountName}
                </h3>
                <p className="text-sm text-blue-300">
                  {currentAccount.accountType} • {currentAccount.currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Accounts */}
      <div>
        <h2 className="text-lg font-medium text-white mb-4">All Accounts ({accounts.length})</h2>
        
        {accounts.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No accounts found</h3>
              <p className="text-gray-400 mb-6">
                Create your first account to start tracking your investments
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map(renderAccountCard)}
          </div>
        )}
      </div>

      {/* TODO: Add Create Account Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Create New Account</CardTitle>
              <CardDescription className="text-gray-400">
                Account creation functionality will be implemented here
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // TODO: Implement account creation
                  setIsCreating(false);
                }}
              >
                Create Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}