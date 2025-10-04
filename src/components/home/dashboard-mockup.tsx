"use client";

import CurrentPositionsMock from "@/components/home/current-positions-mock";
import PortfolioDistribution from "@/components/dashboard/portfolio-distribution";
import SummaryStats from "@/components/dashboard/summary-stats";
import WeeklyReturnsChart from "@/components/dashboard/weekly-returns-chart";
import { Logo } from "@/components/global/logo";

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
            <Logo size="sm" />
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
        <CurrentPositionsMock positions={mockPositions} />
      </div>
    </div>
  );
}
