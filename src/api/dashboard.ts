"use client";

import {
  EnrichedPosition,
  Position,
} from "@/app/(dashboard)/dashboard/actions";
import {
  ViewDailyActivity,
  ViewPortfolioDistribution,
  ViewPortfolioSummary,
  ViewProfitDistribution,
  ViewWeeklyReturn,
} from "@/lib/db/schema";
import { endpoints } from "@/lib/utils";
import useSWR, { mutate } from "swr";

// Fetcher function for API calls
async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
}

// Hook for portfolio summary data
export function usePortfolioSummary() {
  const { data, error, isLoading, mutate } = useSWR<ViewPortfolioSummary>(
    endpoints.dashboard.portfolioSummary,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
    endpoints.dashboard.weeklyReturns,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
    endpoints.dashboard.positions,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
    positions.length > 0
      ? [endpoints.dashboard.positionPrices, positions]
      : null,
    ([url, positions]) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      }).then((res) => res.json()),
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
  const { data, error, isLoading, mutate } = useSWR<
    ViewPortfolioDistribution[]
  >(endpoints.dashboard.portfolioDistribution, fetcher, {
    refreshInterval: 0, // Disable automatic refresh
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

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
    endpoints.dashboard.profitDistribution,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
    endpoints.dashboard.dailyActivity,
    fetcher,
    {
      refreshInterval: 0, // Disable automatic refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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

// Standalone function to refresh all dashboard data (for use in components that don't need the hook)
export async function refreshAllDashboardData() {
  try {
    await Promise.all([
      mutate(endpoints.dashboard.portfolioSummary),
      mutate(endpoints.dashboard.weeklyReturns),
      mutate(endpoints.dashboard.positions),
      mutate(endpoints.dashboard.portfolioDistribution),
      mutate(endpoints.dashboard.profitDistribution),
      mutate(endpoints.dashboard.dailyActivity),
    ]);
  } catch (error) {
    console.error("Failed to refresh dashboard data:", error);
  }
}
