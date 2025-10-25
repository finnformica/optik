import { getAccountKey } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import {
  dimBroker,
  dimDate,
  dimSecurity,
  dimTime,
  dimTransactionType,
  factTransaction,
} from "@/lib/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accountKey = await getAccountKey();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || "";
  const action = searchParams.get("action") || "";
  const broker = searchParams.get("broker") || "";
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  // Build WHERE conditions
  const conditions = [eq(factTransaction.accountKey, accountKey)];

  // Add search filter
  if (search) {
    conditions.push(
      or(
        ilike(dimSecurity.symbol, `%${search}%`),
        ilike(dimTransactionType.actionDescription, `%${search}%`),
        ilike(factTransaction.description, `%${search}%`)
      )!
    );
  }

  // Add action filter
  if (action && action !== "all") {
    conditions.push(eq(dimTransactionType.actionCode, action));
  }

  // Add broker filter
  if (broker && broker !== "all") {
    conditions.push(eq(dimBroker.brokerName, broker));
  }

  // Build sort order
  const getSortColumn = (field: string) => {
    switch (field) {
      case "symbol": return dimSecurity.symbol;
      case "actionCode": return dimTransactionType.actionCode;
      case "quantity": return factTransaction.quantity;
      case "pricePerUnit": return factTransaction.pricePerUnit;
      case "netAmount": return factTransaction.netAmount;
      case "fees": return factTransaction.fees;
      case "strikePrice": return dimSecurity.strikePrice;
      case "brokerName": return dimBroker.brokerName;
      case "date":
      default: return dimDate.fullDate;
    }
  };

  const sortColumn = getSortColumn(sortBy);
  const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Get paginated transactions with count
  const accountTransactions = await db
    .select({
      // Transaction data
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

      // Total count using window function
      count: sql<number>`count(*) over()`,
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
    .where(and(...conditions))
    .orderBy(orderBy, desc(factTransaction.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  // Extract total count from first record (or 0 if no records)
  const totalCount = accountTransactions.length > 0 ? accountTransactions[0].count : 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Remove count from transaction objects
  const transactions = accountTransactions.map(({ count, ...transaction }) => transaction);

  // Get available filters
  const availableActions = await db
    .selectDistinct({ actionCode: dimTransactionType.actionCode })
    .from(factTransaction)
    .innerJoin(
      dimTransactionType,
      eq(factTransaction.transactionTypeKey, dimTransactionType.transactionTypeKey)
    )
    .where(eq(factTransaction.accountKey, accountKey));

  const availableBrokers = await db
    .selectDistinct({ brokerName: dimBroker.brokerName })
    .from(factTransaction)
    .innerJoin(dimBroker, eq(factTransaction.brokerKey, dimBroker.brokerKey))
    .where(eq(factTransaction.accountKey, accountKey));

  return NextResponse.json({
    success: true,
    transactions,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    filters: {
      availableActions: availableActions.map(a => a.actionCode),
      availableBrokers: availableBrokers.map(b => b.brokerName),
    },
  });
}
