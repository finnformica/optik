import { BrokerCode } from "@/types/broker";
import {
  BrokerColumnMapping,
  BrokerValueTransformers,
  StandardizedTransaction,
} from "@/types/import-csv";
import { ParseResult } from "papaparse";

export interface BrokerSchema {
  type: BrokerCode;
  name: string;
  requiredHeaders: string[];
  columnMapping: BrokerColumnMapping;
  valueTransformers: BrokerValueTransformers;
}

const BROKER_SCHEMAS: BrokerSchema[] = [
  {
    type: "ibkr",
    name: "Interactive Brokers - Trades",
    requiredHeaders: [
      "Strike",
      "Expiry",
      "Put/Call",
      "TradeID",
      "OrderID",
      "Date/Time",
      "Buy/Sell",
      "Quantity",
      "NetCash",
      "Commission",
      "Symbol",
      "Description",
    ],
    columnMapping: {
      brokerTransactionId: "TradeID",
      quantity: "Quantity",
      grossAmount: "NetCash", // IB NetCash includes fees, so we'll adjust in transformer
      fees: "Commission",
      netAmount: "NetCash",
      transactionDate: "Date/Time",
      symbol: "Symbol",
      actionCode: "Buy/Sell",
      orderId: "OrderID",
      description: "Description",
      strikePrice: "Strike",
      expiryDate: "Expiry",
      optionType: "Put/Call",
    },
    valueTransformers: {
      transactionDate: (value: string) => {
        // Parse "2025-07-24 16:20:00 EDT" format
        const withoutTz = value.trim().replace(/ [A-Z]{3}$/, "");
        const date = new Date(withoutTz);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${value}`);
        }
        return date;
      },
      grossAmount: (value: string) => {
        // IB NetCash is already net of fees, so we need to calculate gross
        // This will be handled in the transformation logic
        return value;
      },
      fees: (value: string) => {
        // Convert fees to positive value
        const fee = parseFloat(value);
        return Math.abs(fee).toString();
      },
      actionCode: (value: string, row: any) => {
        const action = value.toUpperCase();
        const strike = row.Strike;
        const expiry = row.Expiry;
        const putCall = row["Put/Call"];
        const quantity = parseFloat(row.Quantity) || 0;

        // If it's an option (has strike, expiry, and put/call)
        if (
          strike &&
          strike.trim() !== "" &&
          expiry &&
          expiry.trim() !== "" &&
          putCall &&
          putCall.trim() !== ""
        ) {
          // For options, determine opening vs closing based on quantity sign and action
          if (action === "BUY") {
            // Positive quantity + BUY = buy_to_close (buying back a short position)
            // Negative quantity + BUY = buy_to_open (opening a long position)
            return quantity > 0 ? "buy_to_close" : "buy_to_open";
          } else if (action === "SELL") {
            // Positive quantity + SELL = sell_to_close (closing a long position)
            // Negative quantity + SELL = sell_to_open (opening a short position)
            return quantity > 0 ? "sell_to_close" : "sell_to_open";
          }
        }

        // For stocks, use simple buy/sell
        return action.toLowerCase();
      },
      optionType: (value: string) => {
        if (value === "P") return "PUT";
        if (value === "C") return "CALL";
        return value as "PUT" | "CALL";
      },
      securityType: (value: string) => {
        // If Strike, Expiry, and Put/Call are populated, it's an option
        return value && value.trim() !== "" ? "OPTION" : "STOCK";
      },
      strikePrice: (value: string) => {
        return value && value.trim() !== "" ? value : undefined;
      },
      expiryDate: (value: string) => {
        if (!value || value.trim() === "") return undefined;
        // Parse IB expiry format (e.g., "2025-08-29")
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid expiry date format: ${value}`);
        }
        return date;
      },
    },
  },
  {
    type: "ibkr",
    name: "Interactive Brokers - Transfers",
    requiredHeaders: [
      "Description",
      "Date/Time",
      "Amount",
      "Type",
      "Strike",
      "CurrencyPrimary",
      "Symbol",
    ],
    columnMapping: {
      brokerTransactionId: "Description", // Will be combined with date for uniqueness
      quantity: "", // Quantity is zero for transfers
      grossAmount: "Amount",
      fees: "", // Fees are zero for transfers
      netAmount: "Amount",
      transactionDate: "Date/Time",
      symbol: "Symbol", // Usually empty for transfers
      actionCode: "Type", // "Deposits/Withdrawals" or "Broker Interest Received"
      description: "Description",
    },
    valueTransformers: {
      transactionDate: (value: string) => {
        // Parse "18/05/2025" format (DD/MM/YYYY)
        const [day, month, year] = value.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date format: ${value}`);
        }
        return date;
      },
      quantity: (): number => 0,
      grossAmount: (value: string): number => {
        // Remove commas and quotes from amount
        return parseFloat(value.replace(/[,"]/g, ""));
      },
      netAmount: (value: string): number => {
        // Remove commas and quotes from amount
        return parseFloat(value.replace(/[,"]/g, ""));
      },
      fees: (): number => 0,
      actionCode: (value: string) => {
        // Map IB transfer types to our action codes
        switch (value) {
          case "Deposits/Withdrawals":
            return "transfer";
          case "Broker Interest Received":
            return "interest";
          default:
            return "other";
        }
      },
      securityType: () => {
        return null; // Transfers don't have securities
      },
    },
  },
  // Future broker schemas will be added here
];

/**
 * Detects the broker type based on CSV headers
 */
export function detectBrokerFromHeaders(
  headers: string[],
): BrokerSchema | null {
  const normalizedHeaders = headers.map((h) => h.trim());

  for (const schema of BROKER_SCHEMAS) {
    const hasAllHeaders = schema.requiredHeaders.every((required) =>
      normalizedHeaders.includes(required),
    );

    if (hasAllHeaders) {
      return schema;
    }
  }

  return null;
}

/**
 * Detects broker type from parsed CSV data
 */
export function detectBrokerFromCsv(
  parseResult: ParseResult<any>,
): BrokerSchema | null {
  if (!parseResult.data || parseResult.data.length === 0) {
    return null;
  }

  // Get headers from first row if meta.fields is not available
  const headers =
    parseResult.meta?.fields || Object.keys(parseResult.data[0] || {});

  return detectBrokerFromHeaders(headers);
}

/**
 * Transforms CSV data to standardized transaction format
 */
export function transformCsvToStandardized(
  parseResult: ParseResult<any>,
  brokerSchema: BrokerSchema,
): StandardizedTransaction[] {
  if (!parseResult.data || parseResult.data.length === 0) {
    return [];
  }

  return parseResult.data
    .filter((row: any) => {
      // Filter out empty rows and rows without required transaction ID
      const transactionId = row[brokerSchema.columnMapping.brokerTransactionId];
      return transactionId && transactionId.trim() !== "";
    })
    .map((row: any) => {
      const mapping = brokerSchema.columnMapping;
      const transformers = brokerSchema.valueTransformers;

      // Extract and transform values
      const transactionDate = transformers.transactionDate
        ? transformers.transactionDate(row[mapping.transactionDate])
        : new Date(row[mapping.transactionDate]);

      const actionCode = transformers.actionCode
        ? transformers.actionCode(row[mapping.actionCode], row)
        : row[mapping.actionCode];

      const symbol = row[mapping.symbol];

      // Determine security type
      const strikeValue = mapping.strikePrice ? row[mapping.strikePrice] : "";
      const securityType = transformers.securityType
        ? transformers.securityType(strikeValue)
        : strikeValue && strikeValue.trim() !== ""
          ? "OPTION"
          : "STOCK";

      // Handle underlying symbol
      let underlyingSymbol = symbol;
      if (securityType === "OPTION") {
        // For options, extract underlying symbol (remove option suffix)
        underlyingSymbol = symbol.split(/\s+/)[0]; // Take first part before space
      }

      // Transform fees
      const fees = transformers.fees
        ? transformers.fees(row[mapping.fees])
        : row[mapping.fees];

      const quantity = transformers.quantity
        ? transformers.quantity(row[mapping.quantity])
        : row[mapping.quantity];

      // Handle gross/net amount calculation
      let grossAmount = transformers.grossAmount
        ? transformers.grossAmount(row[mapping.grossAmount])
        : row[mapping.grossAmount];
      let netAmount = transformers.netAmount
        ? transformers.netAmount(row[mapping.netAmount])
        : row[mapping.netAmount];

      // Create unique transaction ID for transfers (combine Date + Amount + Type)
      let transactionId = row[mapping.brokerTransactionId];
      if (brokerSchema.name.includes("Transfers")) {
        // For transfers, create ID from Date + Amount + Type for uniqueness
        const dateStr = transactionDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const amount = row[mapping.grossAmount].replace(/,/g, ""); // Remove commas
        const type = row[mapping.actionCode]; // Type field
        transactionId = `${dateStr}_${amount}_${type}`;
      } else if (!transactionId || transactionId.trim() === "") {
        // Fallback for other types
        transactionId = `${row[mapping.description || "description"] || "transaction"}_${transactionDate.getTime()}`;
      }

      // Handle empty symbol for transfers
      const finalSymbol = symbol && symbol.trim() !== "" ? symbol : "CASH";
      const finalUnderlyingSymbol =
        underlyingSymbol && underlyingSymbol.trim() !== ""
          ? underlyingSymbol
          : "CASH";

      const standardized: StandardizedTransaction = {
        brokerTransactionId: transactionId,
        quantity,
        grossAmount,
        fees,
        netAmount,
        transactionDate,
        symbol: finalSymbol,
        securityType,
        underlyingSymbol: finalUnderlyingSymbol,
        actionCode,
        rawData: row,
      };

      // Add optional fields
      if (mapping.orderId && row[mapping.orderId]) {
        standardized.orderId = row[mapping.orderId];
      }

      if (mapping.description && row[mapping.description]) {
        standardized.description = row[mapping.description];
      }

      if (mapping.pricePerUnit && row[mapping.pricePerUnit]) {
        standardized.pricePerUnit = transformers.pricePerUnit
          ? transformers.pricePerUnit(row[mapping.pricePerUnit])
          : row[mapping.pricePerUnit];
      }

      // Add option-specific fields
      if (securityType === "OPTION") {
        if (mapping.optionType && row[mapping.optionType]) {
          standardized.optionType = transformers.optionType
            ? transformers.optionType(row[mapping.optionType])
            : row[mapping.optionType];
        }

        if (mapping.strikePrice && row[mapping.strikePrice]) {
          standardized.strikePrice = transformers.strikePrice
            ? transformers.strikePrice(row[mapping.strikePrice])
            : row[mapping.strikePrice];
        }

        if (mapping.expiryDate && row[mapping.expiryDate]) {
          standardized.expiryDate = transformers.expiryDate
            ? transformers.expiryDate(row[mapping.expiryDate])
            : new Date(row[mapping.expiryDate]);
        }
      }

      return standardized;
    });
}
