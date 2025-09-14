// Position-related TypeScript interfaces

import { ITransactionAction } from "@/lib/db/schema";

export interface PositionTransaction {
  id: number;
  date: string;
  action: ITransactionAction;
  quantity: number;
  amount: number;
  fees: number;
  description?: string;
  unitPrice: number;
  creditDebitType: "CR" | "DB";
  optionType: string | null;
  costBasis: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

export interface Position {
  positionKey: string;
  ticker: string;
  optionType?: string;
  strikePrice?: number;
  expiryDate?: string;
  netQuantity: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  costBasis: number;
  totalFees: number;
  openedAt: string;
  closedAt?: string;
  lastTransactionAt: string;
  daysHeld: number;
  daysToExpiry?: number;
  isExpiringSoon: boolean;
  transactions: PositionTransaction[];
}

export interface SymbolGroup {
  ticker: string;
  totalPositions: number;
  totalPnl: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalFees: number;
  expiringSoonCount: number;
  positions: Position[];
}

export interface PositionsStats {
  totalPositions: number;
  totalPnl: number;
  expiringSoonTotal?: number;
}

export interface PositionFilters {
  ticker: string;
  strategy: string;
  tags?: string;
  notes?: string;
}

// Strategy types for filtering and display
export type PositionStrategy =
  | "Short Put"
  | "Long Put"
  | "Short Call"
  | "Long Call"
  | "Long Stock"
  | "Short Stock"
  | "Put Trade"
  | "Call Trade"
  | "Stock Trade"
  | "Unknown";

export type PositionEffect = "OPENING" | "CLOSING" | "OTHER";
export type DisplayAction = "BUY" | "SELL";
export type CreditDebitType = "CR" | "DB";
