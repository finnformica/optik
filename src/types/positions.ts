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

interface Position {
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
