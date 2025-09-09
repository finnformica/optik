import { getUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/config';
import { insertRawTransactions, processRawTransactions, SchwabActivity } from '@/lib/db/etl/queries';
import mockTransactions from '@/lib/mock/transactions.json' with { type: 'json' };
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user id' },
        { status: 400 }
      );
    }

    // Use mock data and process it with SchwabAPISync
    const mockData = mockTransactions as unknown as SchwabActivity[];

    const results = await db.transaction(async (tx) => {
      // 1. Insert raw broker data
      const inserted = await insertRawTransactions(mockData, userId, tx);
      console.log(`Inserted ${inserted} transactions`);

      // 2. Process pending transactions
      return await processRawTransactions(userId, tx);
    });

    return NextResponse.json({
      success: results.processed > 0,
      processed: results.processed,
      failed: results.failed,
      errors: results.errors,
      message: `Successfully processed ${results.processed} transactions${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
    });

  } catch (error) {
    console.error('Schwab data ingestion error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
