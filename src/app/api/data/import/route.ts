import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { and, eq, inArray } from "drizzle-orm";

import { getAccountKey } from "@/lib/supabase/server";
import { db } from "@/lib/db/config";
import { stgTransaction } from "@/lib/db/schema";
import {
  detectBrokerFromCsv,
  transformCsvToStandardized,
} from "@/lib/csv/broker-detection";

export async function POST(request: NextRequest) {
  try {
    const accountKey = await getAccountKey();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { success: false, message: "File must be a CSV" },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV parsing failed",
          errors: parseResult.errors.map(e => e.message),
        },
        { status: 400 }
      );
    }

    // Detect broker type
    const brokerSchema = detectBrokerFromCsv(parseResult);
    if (!brokerSchema) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to detect broker type from CSV headers",
          detectedHeaders: parseResult.meta?.fields || [],
        },
        { status: 400 }
      );
    }

    // Transform data to standardized format
    const transformedData = transformCsvToStandardized(parseResult, brokerSchema);
    const brokerCode = brokerSchema.type;

    if (transformedData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid transactions found in CSV",
        },
        { status: 400 }
      );
    }

    // Check for existing transactions to prevent duplicates
    const transactionIds = transformedData.map(t => t.brokerTransactionId);
    const existingTransactions = await db
      .select({ brokerTransactionId: stgTransaction.brokerTransactionId })
      .from(stgTransaction)
      .where(
        and(
          eq(stgTransaction.accountKey, accountKey),
          eq(stgTransaction.brokerCode, brokerCode),
          inArray(stgTransaction.brokerTransactionId, transactionIds)
        )
      );

    const existingIds = new Set(
      existingTransactions.map(t => t.brokerTransactionId)
    );

    // Filter out existing transactions
    const newTransactions = transformedData.filter(
      t => !existingIds.has(t.brokerTransactionId)
    );

    if (newTransactions.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "All transactions already exist in the database",
          totalRows: transformedData.length,
          newTransactions: 0,
          duplicates: transformedData.length,
        },
        { status: 200 }
      );
    }

    // Insert new transactions into staging table
    const stagingRecords = newTransactions.map(transaction => ({
      accountKey,
      brokerCode,
      brokerTransactionId: transaction.brokerTransactionId,
      dataSource: "csv" as const,
      rawData: transaction, // Store the entire standardized transaction
      brokerTimestamp: transaction.transactionDate,
      status: "PENDING" as const,
    }));

    await db.transaction(async (tx) => {
      await tx.insert(stgTransaction).values(stagingRecords);
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${newTransactions.length} new transactions`,
        brokerType: brokerSchema.name,
        totalRows: transformedData.length,
        newTransactions: newTransactions.length,
        duplicates: transformedData.length - newTransactions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error processing CSV import",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}