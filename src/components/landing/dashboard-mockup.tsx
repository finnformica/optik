"use client";

import CurrentPositions from "@/components/dashboard/current-positions";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import {
  mockPortfolioDistribution,
  mockPortfolioSummary,
  mockPositions,
  mockWeeklyData,
} from "./mock-data";

export function DashboardMockup() {
  return (
    <div className="border-border/50 relative overflow-hidden rounded-2xl border bg-[#111827]">
      {/* Header */}
      <div className="border-border/50 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
              <svg
                className="text-primary-foreground h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-foreground text-lg font-semibold">
                Portfolio Dashboard
              </h2>
              <p className="text-muted-foreground text-sm">
                Real-time analytics
              </p>
            </div>
          </div>
          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            Live
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6 p-6">
        {/* Summary Stats */}
        <SummaryStats portfolioSummary={mockPortfolioSummary} />

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Returns Chart */}
          <WeeklyReturnsChart weeklyData={mockWeeklyData} />

          {/* Portfolio Distribution */}
          <PortfolioDistribution
            distribution={mockPortfolioDistribution}
            cashBalance={parseFloat(mockPortfolioSummary.cashBalance || "0")}
          />
        </div>

        {/* Current Positions */}
        <CurrentPositions positions={mockPositions} />
      </div>
    </div>
  );
}
