import {
  dimTransactionType,
  factTransaction,
  StgTransaction,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getBrokerKey, getDate, getOrCreateSecurity } from "./utils";

export async function getSchwabTransactionType(
  schwabType: string,
  positionEffect: string | undefined,
  database: any,
  assetType: string,
  amount: number,
  description: string,
) {
  let actionCode: string;

  switch (schwabType) {
    case "TRADE":
      if (assetType === "OPTION") {
        if (positionEffect === "OPENING") {
          actionCode = amount && amount < 0 ? "sell_to_open" : "buy_to_open";
        } else if (positionEffect === "CLOSING") {
          actionCode = amount && amount < 0 ? "sell_to_close" : "buy_to_close";
        } else {
          actionCode = "other";
        }
      } else {
        actionCode = amount && amount < 0 ? "buy" : "sell";
      }
      break;

    case "DIVIDEND_OR_INTEREST":
      if (description?.toUpperCase().includes("DIV")) {
        actionCode = "dividend";
      } else if (description?.toUpperCase().includes("INT")) {
        actionCode = "interest";
      } else {
        actionCode = "dividend_interest"; // fallback combined bucket
      }
      break;

    case "WIRE_IN":
    case "WIRE_OUT":
      actionCode = "transfer";
      break;

    case "RECEIVE_AND_DELIVER":
      if (description?.toUpperCase().includes("EXPIRATION")) {
        actionCode = "expire";
      } else if (
        description?.toUpperCase().includes("ASSIGNMENT") ||
        description?.toUpperCase().includes("EXERCISE")
      ) {
        actionCode = "assign";
      } else {
        actionCode = "expire"; // Default to expiration for RECEIVE_AND_DELIVER
      }
      break;

    default:
      actionCode = "other";
  }

  // DB lookup
  const [transactionType] = await database
    .select()
    .from(dimTransactionType)
    .where(eq(dimTransactionType.actionCode, actionCode))
    .limit(1);

  if (!transactionType) {
    throw new Error(
      `Transaction type not found for action code: ${actionCode}`,
    );
  }

  return transactionType;
}

/**
 * Prepare Schwab transaction data for batch insertion
 */
export async function prepareSchwabTransaction(
  rawTx: StgTransaction,
  data: any,
  database: any,
) {
  // Extract main security transaction from transferItems
  const securityItem = data.transferItems?.find(
    (item: any) =>
      item.instrument?.assetType === "OPTION" ||
      item.instrument?.assetType === "EQUITY" ||
      item.instrument?.assetType === "COLLECTIVE_INVESTMENT",
  );

  // Calculate total fees
  const totalFees =
    data.transferItems
      ?.filter((item: any) => item.feeType)
      .reduce((sum: number, item: any) => sum + Math.abs(item.cost || 0), 0) ||
    0;

  // Get pre-populated dimensions
  const accountKey = rawTx.accountKey;
  const brokerKey = await getBrokerKey("schwab", database);
  const date = await getDate(data.tradeDate, database);

  // Get or create security (only thing that needs dynamic creation)
  let securityKey = null;
  if (securityItem?.instrument) {
    securityKey = await getOrCreateSecurity(securityItem.instrument, database);

    if (!securityKey) {
      throw new Error(
        `Security data not found for transaction ${data.activityId}`,
      );
    }
  }

  // For cash transactions, we need to determine assetType differently
  const assetType = securityItem?.instrument?.assetType || "CURRENCY";
  const amount = securityItem?.amount || data.netAmount || 0;
  const description =
    data?.description ?? securityItem?.instrument?.description ?? "";

  // Get transaction type (lookup from pre-populated mapping)
  const transactionType = await getSchwabTransactionType(
    data.type,
    securityItem?.positionEffect,
    database,
    assetType,
    amount,
    description,
  );

  // Calculate facts
  const quantity = securityItem?.amount || 0;
  const pricePerUnit = securityItem?.price || null;
  const grossAmount = securityItem?.cost ?? data.netAmount ?? 0;
  const netAmount = data.netAmount || 0;

  // Return data object for batch insertion
  return {
    dateKey: date.dateKey,
    accountKey,
    securityKey,
    transactionTypeKey: transactionType.transactionTypeKey,
    brokerKey,
    brokerTransactionId: data.activityId?.toString(),
    orderId: data.orderId?.toString(),
    description,
    quantity,
    pricePerUnit,
    grossAmount,
    fees: totalFees,
    netAmount,
  };
}

/**
 * Process Schwab-specific transaction format
 */
export async function processSchwabTransaction(
  rawTx: StgTransaction,
  data: any,
  database: any,
) {
  // Extract main security transaction from transferItems
  const securityItem = data.transferItems?.find(
    (item: any) =>
      item.instrument?.assetType === "OPTION" ||
      item.instrument?.assetType === "EQUITY" ||
      item.instrument?.assetType === "COLLECTIVE_INVESTMENT",
  );

  // Calculate total fees
  const totalFees =
    data.transferItems
      ?.filter((item: any) => item.feeType)
      .reduce((sum: number, item: any) => sum + Math.abs(item.cost || 0), 0) ||
    0;

  // Get pre-populated dimensions
  const accountKey = rawTx.accountKey;
  const brokerKey = await getBrokerKey("schwab", database);
  const date = await getDate(data.tradeDate, database);

  // Get or create security (only thing that needs dynamic creation)
  let securityKey = null;
  if (securityItem?.instrument) {
    securityKey = await getOrCreateSecurity(securityItem.instrument, database);

    if (!securityKey) {
      throw new Error(
        `Security data not found for transaction ${data.activityId}`,
      );
    }
  }

  // For cash-only transactions, use a default security or allow null

  // For cash transactions, we need to determine assetType differently
  const assetType = securityItem?.instrument?.assetType || "CURRENCY";
  const amount = securityItem?.amount || data.netAmount || 0;
  const description =
    data?.description ?? securityItem?.instrument?.description ?? "";

  // Get transaction type (lookup from pre-populated mapping)
  const transactionType = await getSchwabTransactionType(
    data.type,
    securityItem?.positionEffect,
    database,
    assetType,
    amount,
    description,
  );

  // Calculate facts
  const quantity = securityItem?.amount || 0;
  const pricePerUnit = securityItem?.price || null;
  const grossAmount = securityItem?.cost ?? data.netAmount ?? 0;
  const netAmount = data.netAmount || 0;

  // Insert into fact_transaction
  await database
    .insert(factTransaction)
    .values({
      dateKey: date.dateKey,
      accountKey,
      securityKey,
      transactionTypeKey: transactionType.transactionTypeKey,
      brokerKey,
      brokerTransactionId: data.activityId?.toString(),
      orderId: data.orderId?.toString(),
      description,
      quantity,
      pricePerUnit,
      grossAmount,
      fees: totalFees,
      netAmount,
    })
    .onConflictDoNothing({
      target: [
        factTransaction.accountKey,
        factTransaction.brokerTransactionId,
        factTransaction.originalTransactionId,
      ],
    });

  // Note: Positions are now calculated from transactions via viewPositions - no separate position maintenance needed
}
