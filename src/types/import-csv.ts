// Standardized transaction interface based on fact_transaction schema
export interface StandardizedTransaction {
  // Required fields for fact_transaction
  brokerTransactionId: string;
  quantity: string;
  grossAmount: string;
  fees: string;
  netAmount: string;
  transactionDate: Date; // Will be split into dateKey and timeKey

  // Optional fields
  orderId?: string;
  description?: string;
  pricePerUnit?: string;

  // Security information (for determining securityKey)
  symbol: string;
  securityType: "STOCK" | "OPTION" | null;
  underlyingSymbol: string;
  optionType?: "PUT" | "CALL";
  strikePrice?: string;
  expiryDate?: Date;

  // Action information (for determining transactionTypeKey)
  actionCode: string; // e.g., 'BUY', 'SELL', etc.

  // Original raw data for reference
  rawData: Record<string, any>;
}

// Column mapping interface for different brokers
export interface BrokerColumnMapping {
  // Required mappings
  brokerTransactionId: string;
  quantity: string;
  grossAmount: string;
  fees: string;
  netAmount: string;
  transactionDate: string;
  symbol: string;
  actionCode: string;

  // Optional mappings
  orderId?: string;
  description?: string;
  pricePerUnit?: string;

  // Security-specific mappings
  securityType?: string; // If not provided, will be inferred
  underlyingSymbol?: string; // If not provided, will use symbol
  optionType?: string;
  strikePrice?: string;
  expiryDate?: string;
}

// Value transformation functions
export interface BrokerValueTransformers {
  transactionDate?: (value: string) => Date;
  quantity?: (value: string) => string | number;
  grossAmount?: (value: string) => string | number;
  fees?: (value: string) => string | number;
  netAmount?: (value: string) => string | number;
  pricePerUnit?: (value: string) => string | number;
  strikePrice?: (value: string) => string | number | undefined;
  expiryDate?: (value: string) => Date | undefined;
  actionCode?: (value: string, row?: any) => string;
  optionType?: (value: string) => "PUT" | "CALL";
  securityType?: (value: string) => "STOCK" | "OPTION" | null;
}
