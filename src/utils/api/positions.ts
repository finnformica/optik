"use client";

import { fetcher } from "@/api/fetchers";
import { endpoints } from "@/lib/utils";
import { PositionsStats, SymbolGroup } from "@/types/positions";
import useSWR from "swr";

interface UsePositionsParams {
  ticker?: string;
  strategy?: string;
}

interface UsePositionsReturn {
  openPositions: SymbolGroup[];
  closedPositions: SymbolGroup[];
  openStats: PositionsStats;
  closedStats: PositionsStats;
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function usePositions({ ticker, strategy }: UsePositionsParams): UsePositionsReturn {
  // Build the URL with query parameters
  const params = new URLSearchParams();
  if (ticker) params.append("ticker", ticker);
  if (strategy) params.append("strategy", strategy);
  
  const url = `${endpoints.positions}?${params.toString()}`;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  // Default values
  const defaultOpenStats: PositionsStats = {
    totalPositions: 0,
    totalPnl: 0,
    expiringSoonTotal: 0,
  };

  const defaultClosedStats: PositionsStats = {
    totalPositions: 0,
    totalPnl: 0,
  };

  return {
    openPositions: data?.openPositions || [],
    closedPositions: data?.closedPositions || [],
    openStats: data?.openStats || defaultOpenStats,
    closedStats: data?.closedStats || defaultClosedStats,
    isLoading,
    error,
    mutate,
  };
}
