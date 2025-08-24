import { getUserId } from '@/lib/auth/session';
import { SchwabAPISync, type SchwabActivity } from '@/lib/connections/schwab/data-sync';
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
    const mockData = mockTransactions as SchwabActivity[]; // Limit to first 10 for testing

    // Process the data using SchwabAPISync
    const syncResult = await SchwabAPISync.syncAPIData(userId, mockData);

    return NextResponse.json({
      success: syncResult.success,
      processed: syncResult.processed,
      errors: syncResult.errors,
      message: `Successfully processed ${syncResult.processed} transactions`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mock Schwab API sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
