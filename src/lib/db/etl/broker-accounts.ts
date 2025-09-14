import { getAccountKey } from "@/lib/auth/session";
import { SchwabAuth } from "@/lib/connections/schwab/oauth";
import { db } from "@/lib/db/config";
import {
  dimAccount,
  dimBroker,
  dimBrokerAccount,
  NewDimBrokerAccount,
  stgTransaction,
} from "@/lib/db/schema";
import { and, desc, eq, notInArray } from "drizzle-orm";

/**
 * Sync Schwab broker accounts during OAuth flow
 * Called when user authenticates with Schwab
 */
export async function syncSchwabBrokerAccounts(): Promise<void> {
  const schwabAuth = new SchwabAuth();
  const accountKey = await getAccountKey();

  try {
    // Get account info from Schwab API
    const accountsFromAPI = await schwabAuth.getAccountNumbers();

    // Get Schwab broker key
    const [{ brokerKey }] = await db
      .select()
      .from(dimBroker)
      .where(eq(dimBroker.brokerCode, "schwab"))
      .limit(1);

    // Sync each account
    for (const apiAccount of accountsFromAPI) {
      await upsertBrokerAccount({
        accountKey,
        brokerKey,
        brokerAccountNumber: apiAccount.accountNumber,
        brokerAccountHash: apiAccount.hashValue,
        isActive: true,
        lastSyncedAt: new Date(),
      });
    }

    // Mark any accounts not returned by API as inactive
    await markMissingAccountsInactive(
      brokerKey,
      accountsFromAPI.map((a) => a.accountNumber)
    );
  } catch (error) {
    console.error("Failed to sync Schwab broker accounts:", error);
    throw error;
  }
}

/**
 * Upsert a broker account record
 */
async function upsertBrokerAccount(
  accountData: Omit<
    NewDimBrokerAccount,
    "brokerAccountKey" | "createdAt" | "updatedAt"
  >
): Promise<void> {
  await db
    .insert(dimBrokerAccount)
    .values({
      ...accountData,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        dimBrokerAccount.accountKey,
        dimBrokerAccount.brokerKey,
        dimBrokerAccount.brokerAccountNumber,
      ],
      set: {
        brokerAccountHash: accountData.brokerAccountHash,
        isActive: accountData.isActive,
        lastSyncedAt: accountData.lastSyncedAt,
        updatedAt: new Date(),
      },
    });
}

/**
 * Mark accounts as inactive if they weren't returned by the API
 */
async function markMissingAccountsInactive(
  brokerKey: number,
  activeAccountNumbers: string[]
): Promise<void> {
  if (activeAccountNumbers.length === 0) return;

  const accountKey = await getAccountKey();

  await db
    .update(dimBrokerAccount)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(dimBrokerAccount.accountKey, accountKey),
        eq(dimBrokerAccount.brokerKey, brokerKey),
        notInArray(dimBrokerAccount.brokerAccountNumber, activeAccountNumbers)
      )
    );

  // TODO: Implement NOT IN logic when needed
  // For now, we'll rely on the upsert keeping active accounts current
}

/**
 * Get all active broker accounts for a user
 */
export async function getActiveBrokerAccounts(brokerCode: string) {
  const accountKey = await getAccountKey();

  return await db
    .select({
      brokerAccountKey: dimBrokerAccount.brokerAccountKey,
      brokerAccountHash: dimBrokerAccount.brokerAccountHash,
      brokerAccountNumber: dimBrokerAccount.brokerAccountNumber,
      lastSyncedAt: dimBrokerAccount.lastSyncedAt,
    })
    .from(dimBrokerAccount)
    .innerJoin(
      dimAccount,
      eq(dimBrokerAccount.accountKey, dimAccount.accountKey)
    )
    .innerJoin(dimBroker, eq(dimBrokerAccount.brokerKey, dimBroker.brokerKey))
    .where(
      and(
        eq(dimAccount.accountKey, accountKey),
        eq(dimBroker.brokerCode, brokerCode),
        eq(dimBrokerAccount.isActive, true)
      )
    );
}

/**
 * Get the last transaction date for a specific broker account
 * Used to determine the start date for incremental sync
 */
export async function getLastTransactionDate(
  brokerCode: string
): Promise<Date> {
  const accountKey = await getAccountKey();

  const result = await db
    .select({
      brokerTimestamp: stgTransaction.brokerTimestamp,
    })
    .from(stgTransaction)
    .where(
      and(
        eq(stgTransaction.accountKey, accountKey),
        eq(stgTransaction.brokerCode, brokerCode)
      )
    )
    .orderBy(desc(stgTransaction.brokerTimestamp))
    .limit(1);

  if (result.length > 0) {
    const lastTimestamp = new Date(result[0].brokerTimestamp);

    // Apply broker-specific logic to avoid re-fetching the same transaction
    switch (brokerCode) {
      case "schwab":
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
