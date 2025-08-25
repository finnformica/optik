// Position-related TypeScript interfaces

import { ITransactionAction } from "@/lib/db/schema";

export interface PositionTransaction {
  id: number;
  date: string;
  action: ITransactionAction;
  displayAction: string;
  positionEffect: string;
  quantity: string;
  amount: string;
  fees: string;
  description?: string;
  unitPrice: number;
  creditDebitType: 'CR' | 'DB';
  priceDisplay: string;
  transactionPnl: string;
}

export interface Position {
  positionKey: string;
  ticker: string;
  optionType?: string;
  strikePrice?: string;
  expiryDate?: string;
  strategy: string;
  netQuantity: string;
  totalPnl: string;
  realizedPnl: string;
  costBasis: string;
  totalFees: string;
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
  | 'Short Put'
  | 'Long Put' 
  | 'Short Call'
  | 'Long Call'
  | 'Long Stock'
  | 'Short Stock'
  | 'Put Trade'
  | 'Call Trade'
  | 'Stock Trade'
  | 'Unknown';

export type PositionEffect = 'OPENING' | 'CLOSING' | 'OTHER';
export type DisplayAction = 'BUY' | 'SELL';
export type CreditDebitType = 'CR' | 'DB';