"use client";

import useSWR from "swr";
import {
  ViewPortfolioSummary,
  ViewWeeklyReturn,
  ViewPortfolioDistribution,
  ViewProfitDistribution,
  ViewDailyActivity
} from "@/lib/db/schema";
import { Position, EnrichedPosition } from "@/app/(dashboard)/dashboard/actions";

// Dashboard API endpoints
export const DASHBOARD_ENDPOINTS = {
  PORTFOLIO_SUMMARY: '/api/dashboard/portfolio-summary',
  WEEKLY_RETURNS: '/api/dashboard/weekly-returns',
  POSITIONS: '/api/dashboard/positions',
  POSITION_PRICES: '/api/dashboard/position-prices',
  PORTFOLIO_DISTRIBUTION: '/api/dashboard/portfolio-distribution',
  PROFIT_DISTRIBUTION: '/api/dashboard/profit-distribution',
  DAILY_ACTIVITY: '/api/dashboard/daily-activity',
} as const;

// Fetcher function for API calls
async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

// Hook for portfolio summary data
export function usePortfolioSummary() {
  const { data, error, isLoading, mutate } = useSWR<ViewPortfolioSummary>(
    DASHBOARD_ENDPOINTS.PORTFOLIO_SUMMARY,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    portfolioSummary: data,
    isLoading,
    error,
    mutate,
  };
}

// Hook for weekly returns data
export function useWeeklyReturns() {
  const { data, error, isLoading, mutate } = useSWR<ViewWeeklyReturn[]>(
    DASHBOARD_ENDPOINTS.WEEKLY_RETURNS,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    weeklyReturns: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for current positions
export function useCurrentPositions() {
  const { data, error, isLoading, mutate } = useSWR<Position[]>(
    DASHBOARD_ENDPOINTS.POSITIONS,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    positions: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for enriched positions with prices
export function useEnrichedPositions(positions: Position[]) {
  const { data, error, isLoading, mutate } = useSWR<EnrichedPosition[]>(
    positions.length > 0 ? [DASHBOARD_ENDPOINTS.POSITION_PRICES, positions] : null,
    ([url, positions]) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions }),
      }).then(res => res.json()),
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    enrichedPositions: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for portfolio distribution
export function usePortfolioDistribution() {
  const { data, error, isLoading, mutate } = useSWR<ViewPortfolioDistribution[]>(
    DASHBOARD_ENDPOINTS.PORTFOLIO_DISTRIBUTION,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    portfolioDistribution: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for profit distribution
export function useProfitDistribution() {
  const { data, error, isLoading, mutate } = useSWR<ViewProfitDistribution[]>(
    DASHBOARD_ENDPOINTS.PROFIT_DISTRIBUTION,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    profitDistribution: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Hook for daily activity/trading heatmap
export function useDailyActivity() {
  const { data, error, isLoading, mutate } = useSWR<ViewDailyActivity[]>(
    DASHBOARD_ENDPOINTS.DAILY_ACTIVITY,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    dailyActivity: data || [],
    isLoading,
    error,
    mutate,
  };
}

// Combined hook to refresh all dashboard data
export function useRefreshDashboard() {
  const { mutate: mutatePortfolioSummary } = usePortfolioSummary();
  const { mutate: mutateWeeklyReturns } = useWeeklyReturns();
  const { mutate: mutatePositions } = useCurrentPositions();
  const { mutate: mutatePortfolioDistribution } = usePortfolioDistribution();
  const { mutate: mutateProfitDistribution } = useProfitDistribution();
  const { mutate: mutateDailyActivity } = useDailyActivity();

  const refreshAll = async () => {
    await Promise.all([
      mutatePortfolioSummary(),
      mutateWeeklyReturns(),
      mutatePositions(),
      mutatePortfolioDistribution(),
      mutateProfitDistribution(),
      mutateDailyActivity(),
    ]);
  };

  return { refreshAll };
}