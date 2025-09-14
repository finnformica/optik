import { getUserId } from '@/lib/auth/session';
import { SchwabAuth } from '@/lib/connections/schwab/oauth';
import { db } from '@/lib/db/config';
import { getActiveBrokerAccounts, getLastTransactionDate } from '@/lib/db/etl/broker-accounts';
import { insertRawTransactions, processRawTransactions, SchwabActivity } from '@/lib/db/etl/queries';
import { NextResponse } from 'next/server';


export async function POST() {
  try {
    const userId = await getUserId();

    const schwabAuth = new SchwabAuth();
    let allTransactions: SchwabActivity[] = [];

    // Get all active Schwab broker accounts from database
    const brokerAccounts = await getActiveBrokerAccounts(userId, 'schwab');

    if (brokerAccounts.length === 0) {
      return NextResponse.json({
        success: false,
        processed: 0,
        failed: 0,
        alert: {
          variant: 'destructive',
          message: 'No active Schwab accounts found. Please re-authenticate with Schwab.'
        }
      });
    }

    // Fetch transactions for each broker account
    for (const account of brokerAccounts) {
      try {
        // Get the last transaction date for incremental sync
        const lastTransactionDate = await getLastTransactionDate(userId, 'schwab');
        
        // Fetch new transactions from Schwab API
        const accountTransactions = await schwabAuth.getTransactionHistory(
          userId,
          account.brokerAccountHash,
          lastTransactionDate,
          new Date()
        );

        if (accountTransactions.length > 0) {
          allTransactions.push(...accountTransactions);
        }
      } catch (accountError) {
        console.error(`Failed to fetch transactions for account ${account.brokerAccountNumber}:`, accountError);
        // Continue with other accounts even if one fails
      }
    }

    // Process all fetched transactions
    const results = await db.transaction(async (tx) => {
      if (allTransactions.length > 0) {
        // 1. Insert raw broker data
        await insertRawTransactions(allTransactions, userId, tx);
      }

      // 2. Process pending transactions
      return await processRawTransactions(userId, tx);
    });


    // Determine alert based on results
    let alert;
    if (allTransactions.length === 0) {
      alert = {
        variant: 'info',
        message: 'Sync completed - no new transactions found.'
      };
    } else if (results.processed > 0 && results.failed === 0) {
      alert = {
        variant: 'success',
        message: `Successfully loaded ${allTransactions.length} transactions and processed ${results.processed} into the database.`
      };
    } else if (results.processed > 0 && results.failed > 0) {
      alert = {
        variant: 'warning',
        message: `Successfully processed ${results.processed} transactions, but ${results.failed} failed. Check logs for details.`
      };
    } else if (results.processed === 0 && results.failed > 0) {
      alert = {
        variant: 'destructive',
        message: `Failed to process ${results.failed} transactions. ${results.errors.length > 0 ? results.errors.join(', ') : 'Check logs for details.'}`
      };
    } else if (results.errors && results.errors.length > 0) {
      alert = {
        variant: 'warning',
        message: `Sync completed with issues: ${results.errors.join(', ')}`
      };
    } else {
      alert = {
        variant: 'success',
        message: 'Sync completed successfully.'
      };
    }

    return NextResponse.json({
      success: results.processed > 0,
      processed: results.processed,
      failed: results.failed,
      transactionsFetched: allTransactions.length,
      alert
    });

  } catch (error) {
    console.error('Schwab data ingestion error:', error);
    return NextResponse.json(
      { 
        success: false,
        processed: 0,
        failed: 0,
        transactionsFetched: 0,
        alert: {
          variant: 'destructive',
          message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }
      },
      { status: 500 }
    );
  }
}
