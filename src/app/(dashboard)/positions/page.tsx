"use client";

import { debounce } from "lodash";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

import { PositionFilters } from "@/components/positions/position-filters";
import { PositionStats } from "@/components/positions/position-stats";
import { PositionTable } from "@/components/positions/position-table";
import { usePositions } from "@/utils/api/positions";

function PositionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get current values from URL search params
  const activeTab = searchParams.get("tab") ?? "open";
  const tickerFilter = searchParams.get("ticker") ?? "";
  const strategyFilter = searchParams.get("strategy") ?? "";

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        value ? params.set(key, value) : params.delete(key);
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Search handlers with Lodash debouncing
  const handleTickerChange = useCallback(
    debounce((value: string) => {
      updateSearchParams({ ticker: value || undefined });
    }, 250),
    [updateSearchParams]
  );

  const handleStrategyChange = useCallback(
    debounce((value: string) => {
      updateSearchParams({ strategy: value || undefined });
    }, 250),
    [updateSearchParams]
  );

  // Tab change handler
  const handleTabChange = useCallback(
    (tab: string) => {
      updateSearchParams({ tab });
    },
    [updateSearchParams]
  );

  // Fetch data from server
  const {
    openPositions,
    closedPositions,
    openStats,
    closedStats,
    isLoading,
    error,
  } = usePositions({
    ticker: tickerFilter,
    strategy: strategyFilter,
  });

  const currentPositions =
    activeTab === "open" ? openPositions : closedPositions;
  const currentStats = activeTab === "open" ? openStats : closedStats;

  return (
    <>
      {/* Page Title */}
      <h1 className="text-3xl font-semibold mb-4">Positions</h1>

      {/* Stats Component */}
      <PositionStats stats={currentStats} isOpen={activeTab === "open"} />

      {/* Filters Component */}
      <PositionFilters
        activeTab={activeTab}
        tickerFilter={tickerFilter}
        strategyFilter={strategyFilter}
        onTabChange={handleTabChange}
        onTickerChange={handleTickerChange}
        onStrategyChange={handleStrategyChange}
        openCount={openStats.totalPositions}
        closedCount={closedStats.totalPositions}
      />

      {/* Table Component */}
      <PositionTable
        positions={currentPositions}
        isOpen={activeTab === "open"}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}

export default function PositionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PositionsPageContent />
    </Suspense>
  );
}
