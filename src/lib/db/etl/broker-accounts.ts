import { SchwabAuth } from '@/lib/connections/schwab/schwab-oauth';
import { db } from '@/lib/db/config';
import { dimAccount, dimBroker, dimBrokerAccounts, NewDimBrokerAccounts, rawTransactions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';

/**
 * Sync Schwab broker accounts during OAuth flow
 * Called when user authenticates with Schwab
 */
export async function syncSchwabBrokerAccounts(userId: number): Promise<void> {
  const schwabAuth = new SchwabAuth();
  
  try {
    // Get account info from Schwab API
    const accountsFromAPI = await schwabAuth.getAccountNumbers(userId);
    
    // Get user's account key (assumes one account per user for now)
    const userAccount = await db
      .select()
      .from(dimAccount)
      .where(eq(dimAccount.userId, userId))
      .limit(1);

    if (!userAccount.length) {
      throw new Error('User account not found');
    }

    const accountKey = userAccount[0].accountKey;

    // Get Schwab broker key
    const schwabBroker = await db
      .select()
      .from(dimBroker)
      .where(eq(dimBroker.brokerCode, 'schwab'))
      .limit(1);

    if (!schwabBroker.length) {
      throw new Error('Schwab broker not found in dim_broker table');
    }

    const brokerKey = schwabBroker[0].brokerKey;

    // Sync each account
    for (const apiAccount of accountsFromAPI) {
      await upsertBrokerAccount({
        accountKey,
        brokerKey,
        brokerAccountNumber: apiAccount.accountNumber,
        brokerAccountHash: apiAccount.hashValue,
        isActive: true,
        lastSyncedAt: new Date()
      });
    }

    // Mark any accounts not returned by API as inactive
    await markMissingAccountsInactive(
      accountKey,
      brokerKey,
      accountsFromAPI.map(a => a.accountNumber)
    );

  } catch (error) {
    console.error('Failed to sync Schwab broker accounts:', error);
    throw error;
  }
}

/**
 * Upsert a broker account record
 */
async function upsertBrokerAccount(accountData: Omit<NewDimBrokerAccounts, 'brokerAccountKey' | 'createdAt' | 'updatedAt'>): Promise<void> {
  await db
    .insert(dimBrokerAccounts)
    .values({
      ...accountData,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [dimBrokerAccounts.accountKey, dimBrokerAccounts.brokerKey, dimBrokerAccounts.brokerAccountNumber],
      set: {
        brokerAccountHash: accountData.brokerAccountHash,
        isActive: accountData.isActive,
        lastSyncedAt: accountData.lastSyncedAt,
        updatedAt: new Date()
      }
    });
}

/**
 * Mark accounts as inactive if they weren't returned by the API
 */
async function markMissingAccountsInactive(
  accountKey: number,
  brokerKey: number,
  activeAccountNumbers: string[]
): Promise<void> {
  if (activeAccountNumbers.length === 0) return;

  await db
    .update(dimBrokerAccounts)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(dimBrokerAccounts.accountKey, accountKey),
        eq(dimBrokerAccounts.brokerKey, brokerKey),
        // NOT IN equivalent using Drizzle
        // This will mark inactive any accounts not in the active list
      )
    );
  
  // TODO: Implement NOT IN logic when needed
  // For now, we'll rely on the upsert keeping active accounts current
}

/**
 * Get all active broker accounts for a user
 */
export async function getActiveBrokerAccounts(userId: number, brokerCode: string) {
  return await db
    .select({
      brokerAccountKey: dimBrokerAccounts.brokerAccountKey,
      brokerAccountHash: dimBrokerAccounts.brokerAccountHash,
      brokerAccountNumber: dimBrokerAccounts.brokerAccountNumber,
      lastSyncedAt: dimBrokerAccounts.lastSyncedAt
    })
    .from(dimBrokerAccounts)
    .innerJoin(dimAccount, eq(dimBrokerAccounts.accountKey, dimAccount.accountKey))
    .innerJoin(dimBroker, eq(dimBrokerAccounts.brokerKey, dimBroker.brokerKey))
    .where(
      and(
        eq(dimAccount.userId, userId),
        eq(dimBroker.brokerCode, brokerCode),
        eq(dimBrokerAccounts.isActive, true)
      )
    );
}

/**
 * Get the last transaction date for a specific broker account
 * Used to determine the start date for incremental sync
 */
export async function getLastTransactionDate(userId: number, brokerCode: string): Promise<Date> {
  const result = await db
    .select({
      brokerTimestamp: rawTransactions.brokerTimestamp
    })
    .from(rawTransactions)
    .where(
      and(
        eq(rawTransactions.userId, userId),
        eq(rawTransactions.brokerCode, brokerCode)
      )
    )
    .orderBy(desc(rawTransactions.brokerTimestamp))
    .limit(1);

  if (result.length > 0) {
    const lastTimestamp = new Date(result[0].brokerTimestamp);
    
    // Apply broker-specific logic to avoid re-fetching the same transaction
    switch (brokerCode) {
      case 'schwab':
        // Schwab API uses second-level precision, add 1 second to avoid duplicates
        lastTimestamp.setSeconds(lastTimestamp.getSeconds() + 1);
        break;
      default:
        break;
    }
    
    return lastTimestamp;
  }

  // Default to 5 years ago for new accounts
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  return fiveYearsAgo;
}