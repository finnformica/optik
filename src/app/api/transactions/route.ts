import { getCurrentAccountKey } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import {
  dimBroker,
  dimDate,
  dimSecurity,
  dimTime,
  dimTransactionType,
  factTransaction,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accountKey = await getCurrentAccountKey();

  // Get all transactions for the account with dimension data
  const accountTransactions = await db
    .select({
      // Transaction facts
      quantity: factTransaction.quantity,
      pricePerUnit: factTransaction.pricePerUnit,
      grossAmount: factTransaction.grossAmount,
      fees: factTransaction.fees,
      netAmount: factTransaction.netAmount,
      brokerTransactionId: factTransaction.brokerTransactionId,
      orderId: factTransaction.orderId,
      description: factTransaction.description,

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
      createdAt: factTransaction.createdAt,
      updatedAt: factTransaction.updatedAt,
    })
    .from(factTransaction)
    .leftJoin(
      dimSecurity,
      eq(factTransaction.securityKey, dimSecurity.securityKey)
    )
    .innerJoin(dimDate, eq(factTransaction.dateKey, dimDate.dateKey))
    .innerJoin(dimTime, eq(factTransaction.timeKey, dimTime.timeKey))
    .innerJoin(
      dimTransactionType,
      eq(
        factTransaction.transactionTypeKey,
        dimTransactionType.transactionTypeKey
      )
    )
    .innerJoin(dimBroker, eq(factTransaction.brokerKey, dimBroker.brokerKey))
    .where(eq(factTransaction.accountKey, accountKey))
    .orderBy(
      desc(dimTime.timeKey),
      desc(dimDate.fullDate),
      desc(factTransaction.createdAt)
    );

  return NextResponse.json({
    success: true,
    transactions: accountTransactions,
    count: accountTransactions.length,
  });
}
