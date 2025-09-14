import { getAccountKey } from '@/lib/auth/session';
import { db } from '@/lib/db/config';
import {
  dimAccount,
  dimBroker,
  dimDate,
  dimSecurity,
  dimTransactionType,
  factTransactions
} from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const accountKey = await getAccountKey();

    // Get all transactions for the account with dimension data
    const accountTransactions = await db
      .select({
        // Transaction facts
        quantity: factTransactions.quantity,
        pricePerUnit: factTransactions.pricePerUnit,
        grossAmount: factTransactions.grossAmount,
        fees: factTransactions.fees,
        netAmount: factTransactions.netAmount,
        brokerTransactionId: factTransactions.brokerTransactionId,
        orderId: factTransactions.orderId,
        description: factTransactions.description,

        // Date information
        date: dimDate.fullDate,

        // Security information
        symbol: dimSecurity.symbol,
        securityType: dimSecurity.securityType,
        underlyingSymbol: dimSecurity.underlyingSymbol,
        optionType: dimSecurity.optionType,
        strikePrice: dimSecurity.strikePrice,
        expiryDate: dimSecurity.expiryDate,

        // Transaction type
        actionCode: dimTransactionType.actionCode,
        actionDescription: dimTransactionType.actionDescription,
        actionCategory: dimTransactionType.actionCategory,

        // Broker information
        brokerName: dimBroker.brokerName,

        // Timestamps
        createdAt: factTransactions.createdAt,
        updatedAt: factTransactions.updatedAt
      })
      .from(factTransactions)
      .leftJoin(dimSecurity, eq(factTransactions.securityKey, dimSecurity.securityKey))
      .innerJoin(dimDate, eq(factTransactions.dateKey, dimDate.dateKey))
      .innerJoin(dimTransactionType, eq(factTransactions.transactionTypeKey, dimTransactionType.transactionTypeKey))
      .innerJoin(dimBroker, eq(factTransactions.brokerKey, dimBroker.brokerKey))
      .where(eq(factTransactions.accountKey, accountKey))
      .orderBy(desc(dimDate.fullDate), desc(factTransactions.createdAt));

    return NextResponse.json({
      success: true,
      transactions: accountTransactions,
      count: accountTransactions.length
    });
}